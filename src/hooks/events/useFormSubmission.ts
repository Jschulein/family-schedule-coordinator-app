
import { useState, useRef } from 'react';
import { logEventFlow } from '@/utils/events';
import { useFormPerformance } from './useFormPerformance';
import { useEventFormValidation } from './useEventFormValidation';

interface FormSubmissionHookProps {
  name: string;
  date: Date | undefined;
  endDate: Date | undefined;
  time: string;
  description: string;
  familyMembers: string[];
  allDay: boolean;
  onSubmit: (eventData: any) => void;
}

/**
 * Custom hook for handling form submission logic
 */
export function useFormSubmission({
  name,
  date,
  endDate,
  time,
  description,
  familyMembers,
  allDay,
  onSubmit
}: FormSubmissionHookProps) {
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation hooks
  const { 
    formError, 
    setFormError, 
    validateForm,
    checkAuthSession 
  } = useEventFormValidation();
  
  // Performance tracking
  const { 
    lastSubmitTime, 
    trackSubmissionStart, 
    trackSubmissionComplete,
    trackSubmissionError 
  } = useFormPerformance();
  
  // Refs for debounce and cleanup
  const submitTimeoutRef = useRef<number | null>(null);
  
  /**
   * Handle form submission
   * @param e Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Start performance tracking
    trackSubmissionStart(name);
    
    setFormError(null);
    
    // Debounce protection (300ms window)
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
    
    // Validate form data
    const validationError = validateForm(name, date);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    
    try {
      // Set submission state
      setIsSubmitting(true);
      
      // Pre-flight auth check
      const { session, error: authError } = await checkAuthSession();
      if (authError) {
        setFormError(authError);
        setIsSubmitting(false);
        return;
      }
      
      // Submit the form data to parent component
      onSubmit({ 
        name, 
        date, 
        end_date: endDate || date,
        time,
        description, 
        creatorId: session?.user.id,
        familyMembers,
        all_day: allDay
      });
      
      // Safety timeout if parent never updates isSubmitting
      submitTimeoutRef.current = window.setTimeout(() => {
        logEventFlow('EventForm', 'Safety timeout triggered - resetting state');
        setIsSubmitting(false);
      }, 10000);
    } catch (error: any) {
      logEventFlow('EventForm', 'Unexpected form submission error', error);
      trackSubmissionError(error);
      
      setFormError(error?.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  /**
   * Reset submission state when parent indicates completion
   */
  const resetSubmissionState = () => {
    setIsSubmitting(false);
    
    // Log performance metrics
    trackSubmissionComplete(name);
    
    // Clear the safety timeout
    if (submitTimeoutRef.current) {
      window.clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }
  };

  /**
   * Cleanup function for component unmount
   */
  const cleanupSubmission = () => {
    if (submitTimeoutRef.current) {
      window.clearTimeout(submitTimeoutRef.current);
    }
  };

  return {
    isSubmitting,
    formError,
    handleSubmit,
    resetSubmissionState,
    cleanupSubmission
  };
}
