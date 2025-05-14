
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventNameInput } from './events/EventNameInput';
import { EventDateInput } from './events/EventDateInput';
import { EventTimeInput } from './events/EventTimeInput';
import { EventDescriptionInput } from './events/EventDescriptionInput';
import { EventFamilyMembersInput } from './events/EventFamilyMembersInput';
import { EventEndDateInput } from './events/EventEndDateInput';
import { EventAllDayToggle } from './events/EventAllDayToggle';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";

interface Event {
  name: string;
  date: Date;
  end_date?: Date;
  time: string;
  description: string;
  creatorId: string;
  familyMembers: string[];
  all_day: boolean;
}

interface AddEventFormProps {
  onSubmit: (event: Event) => void;
  isSubmitting?: boolean;
}

const AddEventForm = ({ onSubmit, isSubmitting = false }: AddEventFormProps) => {
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
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [validationChecked, setValidationChecked] = useState(false);
  
  // Refs for debounce and tracking
  const submitTimeoutRef = useRef<number | null>(null);
  const lastSubmitTime = useRef<number>(0);
  const formMountTime = useRef<number>(performance.now());
  const formSessionId = useRef<string>(`form-${Date.now()}`);
  
  // Start tracking form performance
  useEffect(() => {
    const trackId = performanceTracker.startMeasure('AddEventForm:mount', {
      sessionId: formSessionId.current
    });
    
    return () => {
      performanceTracker.endMeasure(trackId);
    };
  }, []);
  
  // Reset local submitting state when parent submitting state changes
  useEffect(() => {
    if (!isSubmitting && localSubmitting) {
      setLocalSubmitting(false);
      
      // Log performance metrics for submission completion
      performanceTracker.measure('AddEventForm:submission:complete', 
        () => {
          logEventFlow('AddEventForm', 'Form submission complete', { 
            name, 
            elapsedTime: performance.now() - lastSubmitTime.current 
          });
        }
      );
    }
  }, [isSubmitting, localSubmitting, name]);
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Start performance tracking for submission
    performanceTracker.startMeasure('AddEventForm:submission:start', { name });
    lastSubmitTime.current = performance.now();
    
    logEventFlow('AddEventForm', 'Form submission initiated', { name, date });
    setFormError(null);
    
    // Debounce protection against double-clicks (300ms window)
    const now = Date.now();
    if (now - lastSubmitTime.current < 300) {
      logEventFlow('AddEventForm', 'Submission debounced - too frequent', { timeSinceLastSubmit: now - lastSubmitTime.current });
      return;
    }
    
    // Prevent duplicate submissions
    if (isSubmitting || localSubmitting) {
      logEventFlow('AddEventForm', 'Submission prevented - already submitting', { isSubmitting, localSubmitting });
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
      setLocalSubmitting(true);
      
      // Pre-flight auth check to fail fast if no session
      const authResponse = await performanceTracker.measure(
        'AddEventForm:authCheck',
        () => supabase.auth.getSession()
      );
      
      const { data: { session }, error: sessionError } = authResponse;
      
      if (sessionError) {
        logEventFlow('AddEventForm', 'Authentication error', sessionError);
        setFormError("Authentication error. Please try logging in again.");
        setLocalSubmitting(false);
        return;
      }
      
      if (!session?.user?.id) {
        logEventFlow('AddEventForm', 'No authenticated user found');
        setFormError("No authenticated user found. Please log in and try again.");
        setLocalSubmitting(false);
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
      submitTimeoutRef.current = window.setTimeout(() => {
        logEventFlow('AddEventForm', 'Safety timeout triggered - resetting state');
        setLocalSubmitting(false);
      }, 10000);
    } catch (error: any) {
      logEventFlow('AddEventForm', 'Unexpected form submission error', error);
      performanceTracker.measure('AddEventForm:submission:error', 
        () => console.error('Form submission error:', error)
      );
      
      setFormError(error?.message || "An unexpected error occurred");
      setLocalSubmitting(false);
    }
  };

  const isFormValid = name && name.length >= 3 && date;
  const effectiveSubmitting = isSubmitting || localSubmitting;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add Family Event</CardTitle>
        <CardDescription>Schedule a new event for your family calendar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EventNameInput 
            value={name} 
            onChange={setName} 
          />
          <EventDateInput 
            value={date} 
            onSelect={setDate} 
          />
          <EventEndDateInput 
            value={endDate} 
            onSelect={setEndDate}
            startDate={date}
          />
          <EventAllDayToggle
            value={allDay}
            onChange={setAllDay}
          />
          {!allDay && (
            <EventTimeInput
              value={time}
              onChange={setTime}
            />
          )}
          <EventDescriptionInput 
            value={description} 
            onChange={setDescription} 
          />
          <EventFamilyMembersInput 
            value={familyMembers} 
            onChange={setFamilyMembers} 
          />
          
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={!isFormValid || effectiveSubmitting}
          >
            {effectiveSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              'Add Event'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddEventForm;
