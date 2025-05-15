
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventNameInput } from './EventNameInput';
import { EventDateInput } from './EventDateInput';
import { EventTimeInput } from './EventTimeInput';
import { EventDescriptionInput } from './EventDescriptionInput';
import { EventFamilyMembersInput } from './EventFamilyMembersInput';
import { EventEndDateInput } from './EventEndDateInput';
import { EventAllDayToggle } from './EventAllDayToggle';
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEventFormState } from '../useEventFormState';
import { ReactNode } from 'react';

interface EventFormData {
  name: string;
  date: Date;
  end_date?: Date;
  time: string;
  description: string;
  creatorId: string;
  familyMembers: string[];
  all_day: boolean;
}

interface EventFormProps {
  onSubmit: (event: EventFormData) => void;
  isSubmitting?: boolean; // This is passed from the parent and represents actual submission
  buttonText?: string;
  title?: string;
  description?: string;
  initialValues?: Partial<EventFormData>;
  extraButtons?: ReactNode; // Added to support custom buttons in edit mode
}

/**
 * Reusable event form component for both adding and editing events
 */
export const EventForm = ({ 
  onSubmit, 
  isSubmitting = false,
  buttonText = 'Add Event',
  title = 'Add Family Event',
  description = 'Schedule a new event for your family calendar',
  initialValues,
  extraButtons
}: EventFormProps) => {
  // Use our custom form state hook
  const {
    name, setName,
    date, setDate,
    endDate, setEndDate,
    time, setTime,
    description: eventDescription, setDescription,
    familyMembers, setFamilyMembers,
    allDay, setAllDay,
    
    formError,
    isSubmitting: localSubmitting,
    isFormValid,
    
    handleSubmit,
    resetSubmissionState
  } = useEventFormState(onSubmit);
  
  // Apply initial values if provided
  useEffect(() => {
    if (initialValues) {
      if (initialValues.name) setName(initialValues.name);
      if (initialValues.date) setDate(initialValues.date);
      if (initialValues.end_date) setEndDate(initialValues.end_date);
      if (initialValues.time) setTime(initialValues.time);
      if (initialValues.description) setDescription(initialValues.description);
      if (initialValues.familyMembers) setFamilyMembers(initialValues.familyMembers);
      if (typeof initialValues.all_day !== 'undefined') setAllDay(initialValues.all_day);
    }
  }, [initialValues]);
  
  // Reset local submitting state when parent submitting state changes
  useEffect(() => {
    // Only handle transition from submitting -> not submitting
    if (!isSubmitting && localSubmitting) {
      resetSubmissionState();
    }
  }, [isSubmitting, localSubmitting, resetSubmissionState]);
  
  // Use both the parent's submission state and our local state
  // This ensures we catch both scenarios
  const effectiveSubmitting = isSubmitting || localSubmitting;

  return (
    <>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
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
          value={eventDescription} 
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
        
        <div className="flex justify-between gap-4 pt-2">
          {extraButtons}
          
          <Button 
            type="submit" 
            className={extraButtons ? "flex-1" : "w-full"}
            disabled={!isFormValid || effectiveSubmitting}
          >
            {effectiveSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {buttonText === 'Add Event' ? 'Creating Event...' : 'Updating Event...'}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </form>
    </>
  );
};
