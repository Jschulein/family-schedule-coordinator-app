
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
  
  // Reset internal submitting state when parent submitting state changes to false
  useEffect(() => {
    if (!isSubmitting && internalSubmitting) {
      setInternalSubmitting(false);
    }
  }, [isSubmitting, internalSubmitting]);
  
  // Double-check submitting state with a timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (isSubmitting) {
      // After 8 seconds, log a warning
      timeoutId = setTimeout(() => {
        console.log("AddEventForm is still in submitting state after 8 seconds");
      }, 8000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isSubmitting]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (internalSubmitting || isSubmitting) {
      console.log("Form submission already in progress - ignoring duplicate submission");
      return;
    }
    
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
      setInternalSubmitting(true);
      console.log("Form validation passed, checking authentication...");
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setFormError("Authentication error. Please try logging in again.");
        console.error("Session error:", sessionError);
        setInternalSubmitting(false);
        return;
      }
      
      const userId = session?.user.id;
      
      if (!userId) {
        setFormError("No authenticated user found. Please log in and try again.");
        console.error("No authenticated user found");
        setInternalSubmitting(false);
        return;
      }
      
      console.log("Submitting form with data:", {
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
    } catch (error) {
      console.error("Error in form submission:", error);
      setFormError("Error submitting form. Please try again.");
      setInternalSubmitting(false);
    }
  };

  const isFormValid = name && name.length >= 3 && date;

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
            disabled={!isFormValid || isSubmitting || internalSubmitting}
          >
            {(isSubmitting || internalSubmitting) ? (
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
