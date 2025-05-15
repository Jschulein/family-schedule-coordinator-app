
import { useState, useEffect, useRef } from 'react';
import { logEventFlow } from '@/utils/events';
import { performanceTracker } from '@/utils/testing/performanceTracker';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook for managing event form state and validation
 * Separates form state management from the UI component
 */
export function useEventFormState(onSubmit: (eventData: any) => void) {
  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [allDay, setAllDay] = useState(false);
  
  // Form status
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationChecked, setValidationChecked] = useState(false);
  
  // Refs for debounce and tracking
  const submitTimeoutRef = useRef<number | null>(null);
  const lastSubmitTime = useRef<number>(0);
  const formMountTime = useRef<number>(performance.now());
  const formSessionId = useRef<string>(`form-${Date.now()}`);

  // Start tracking form performance
  useEffect(() => {
    const trackId = performanceTracker.startMeasure('EventForm:mount', {
      sessionId: formSessionId.current
    });
    
    return () => {
      performanceTracker.endMeasure(trackId);
    };
  }, []);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        window.clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);
  
  // Perform validation on form data change
  useEffect(() => {
    const isValid = name && name.length >= 3 && date;
    setValidationChecked(true);
    
    if (isValid && formError) {
      setFormError(null);
    }
  }, [name, date, formError]);

  // Form is valid when name is at least 3 characters and date is selected
  const isFormValid = name && name.length >= 3 && date;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Start performance tracking for submission
    performanceTracker.startMeasure('EventForm:submission:start', { name });
    lastSubmitTime.current = performance.now();
    
    logEventFlow('EventForm', 'Form submission initiated', { name, date });
    setFormError(null);
    
    // Debounce protection against double-clicks (300ms window)
    const now = Date.now();
    if (now - lastSubmitTime.current < 300) {
      logEventFlow('EventForm', 'Submission debounced - too frequent', { 
        timeSinceLastSubmit: now - lastSubmitTime.current 
      });
      return;
    }
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      logEventFlow('EventForm', 'Submission prevented - already submitting');
      return;
    }
    
    // Basic validation
    if (!name) {
      setFormError("Please provide an event name.");
      return;
    }
    
    if (!date) {
      setFormError("Please select a date for the event.");
      return;
    }
    
    if (name.length < 3) {
      setFormError("Event name must be at least 3 characters long.");
      return;
    }
    
    try {
      // Set local submission state
      setIsSubmitting(true);
      
      // Pre-flight auth check to fail fast if no session
      const authResponse = await performanceTracker.measure(
        'EventForm:authCheck',
        () => supabase.auth.getSession()
      );
      
      const { data: { session }, error: sessionError } = authResponse;
      
      if (sessionError) {
        logEventFlow('EventForm', 'Authentication error', sessionError);
        setFormError("Authentication error. Please try logging in again.");
        setIsSubmitting(false);
        return;
      }
      
      if (!session?.user?.id) {
        logEventFlow('EventForm', 'No authenticated user found');
        setFormError("No authenticated user found. Please log in and try again.");
        setIsSubmitting(false);
        return;
      }
      
      // Submit the form data to parent
      onSubmit({ 
        name, 
        date, 
        end_date: endDate || date,
        time,
        description, 
        creatorId: session.user.id,
        familyMembers,
        all_day: allDay
      });
      
      // Safety timeout if the parent never updates isSubmitting
      // This is a fallback in case the parent component doesn't handle the state properly
      submitTimeoutRef.current = window.setTimeout(() => {
        logEventFlow('EventForm', 'Safety timeout triggered - resetting state');
        setIsSubmitting(false);
      }, 10000);
    } catch (error: any) {
      logEventFlow('EventForm', 'Unexpected form submission error', error);
      performanceTracker.measure('EventForm:submission:error', 
        () => console.error('Form submission error:', error)
      );
      
      setFormError(error?.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Reset submission state when parent indicates completion
  const resetSubmissionState = () => {
    setIsSubmitting(false);
    
    // Log performance metrics for submission completion
    performanceTracker.measure('EventForm:submission:complete', 
      () => {
        logEventFlow('EventForm', 'Form submission complete', { 
          name, 
          elapsedTime: performance.now() - lastSubmitTime.current 
        });
      }
    );
    
    // Clear the safety timeout if it exists
    if (submitTimeoutRef.current) {
      window.clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
  };

  return {
    // Form state
    name, setName,
    date, setDate,
    endDate, setEndDate,
    time, setTime,
    description, setDescription,
    familyMembers, setFamilyMembers,
    allDay, setAllDay,
    
    // Form status
    formError,
    isSubmitting,
    isFormValid,
    
    // Actions
    handleSubmit,
    resetSubmissionState
  };
}
