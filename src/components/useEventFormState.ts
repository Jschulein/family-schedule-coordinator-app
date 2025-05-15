
import { useState, useEffect } from 'react';
import { useFormSubmission } from '@/hooks/events/useFormSubmission';
import { useEventFormValidation } from '@/hooks/events/useEventFormValidation';

/**
 * Custom hook for managing event form state and validation
 * Separates form state management from the UI component
 * @param onSubmit Callback function to handle form submission
 * @returns Form state, validation status, and handler functions
 */
export function useEventFormState(onSubmit: (eventData: any) => void) {
  // Form field state
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [allDay, setAllDay] = useState(false);
  
  // Get validation utilities
  const { validationChecked, setValidationChecked } = useEventFormValidation();
  
  // Get submission utilities
  const {
    isSubmitting,
    formError,
    handleSubmit,
    resetSubmissionState,
    cleanupSubmission
  } = useFormSubmission({
    name,
    date,
    endDate,
    time,
    description,
    familyMembers,
    allDay,
    onSubmit
  });
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanupSubmission;
  }, []);
  
  // Perform validation on form data change
  useEffect(() => {
    const isValid = name && name.length >= 3 && date;
    setValidationChecked(true);
  }, [name, date, setValidationChecked]);

  // Form is valid when name is at least 3 characters and date is selected
  const isFormValid = name && name.length >= 3 && date;

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
