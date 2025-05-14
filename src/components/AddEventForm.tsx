
import { useState, useEffect } from 'react';
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
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [allDay, setAllDay] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const [hasTriedToSubmit, setHasTriedToSubmit] = useState(false);
  
  // Log initial state and props
  useEffect(() => {
    logEventFlow('AddEventForm', 'Component mounted', { isSubmitting });
    
    // Reset form state if this is a fresh mount
    return () => {
      logEventFlow('AddEventForm', 'Component unmounting');
    };
  }, []);
  
  // Reset internal submitting state when parent submitting state changes to false
  useEffect(() => {
    logEventFlow('AddEventForm', 'isSubmitting prop changed', { isSubmitting, internalSubmitting });
    
    if (!isSubmitting && internalSubmitting) {
      logEventFlow('AddEventForm', 'Resetting internal submitting state because parent is no longer submitting');
      setInternalSubmitting(false);
    }
  }, [isSubmitting, internalSubmitting]);
  
  // Double-check submitting state with a timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isSubmitting || internalSubmitting) {
      logEventFlow('AddEventForm', 'Starting submission state safety timeout');
      // After 8 seconds, log a warning and reset if still submitting
      timeoutId = setTimeout(() => {
        if (isSubmitting || internalSubmitting) {
          logEventFlow('AddEventForm', 'SAFETY TIMEOUT: Form still submitting after 8 seconds', 
                      { isSubmitting, internalSubmitting });
          setInternalSubmitting(false);
        }
      }, 8000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSubmitting, internalSubmitting]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logEventFlow('AddEventForm', 'Form submission initiated', { name, date });
    setFormError(null);
    setHasTriedToSubmit(true);
    
    if (internalSubmitting || isSubmitting) {
      logEventFlow('AddEventForm', 'Ignoring duplicate submission attempt - already submitting');
      return;
    }
    
    // Validation
    if (!name) {
      logEventFlow('AddEventForm', 'Validation failed: No event name');
      setFormError("Please provide an event name.");
      return;
    }
    
    if (!date) {
      logEventFlow('AddEventForm', 'Validation failed: No date selected');
      setFormError("Please select a date for the event.");
      return;
    }
    
    if (name.length < 3) {
      logEventFlow('AddEventForm', 'Validation failed: Event name too short');
      setFormError("Event name must be at least 3 characters long.");
      return;
    }
    
    try {
      setInternalSubmitting(true);
      logEventFlow('AddEventForm', 'Starting authentication check');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logEventFlow('AddEventForm', 'Authentication error', sessionError);
        setFormError("Authentication error. Please try logging in again.");
        setInternalSubmitting(false);
        return;
      }
      
      const userId = session?.user.id;
      
      if (!userId) {
        logEventFlow('AddEventForm', 'No authenticated user found');
        setFormError("No authenticated user found. Please log in and try again.");
        setInternalSubmitting(false);
        return;
      }
      
      logEventFlow('AddEventForm', 'Authentication successful, calling onSubmit', {
        name, date, endDate, time, description, familyMembers, allDay
      });
      
      onSubmit({ 
        name, 
        date, 
        end_date: endDate || date,
        time,
        description, 
        creatorId: userId,
        familyMembers,
        all_day: allDay
      });
      
      // Note: we don't reset internal submitting here because the parent component
      // will set isSubmitting to false when the submission completes
      // This will be caught by the useEffect above
    } catch (error) {
      logEventFlow('AddEventForm', 'Error in form submission', error);
      setFormError("Error submitting form. Please try again.");
      setInternalSubmitting(false);
    }
  };

  const isFormValid = name && name.length >= 3 && date;
  const isActuallySubmitting = isSubmitting || internalSubmitting;
  
  logEventFlow('AddEventForm', 'Render state', { 
    isFormValid, 
    isActuallySubmitting,
    isSubmitting, 
    internalSubmitting,
    hasTriedToSubmit
  });

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
            disabled={!isFormValid || isActuallySubmitting}
          >
            {isActuallySubmitting ? (
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
