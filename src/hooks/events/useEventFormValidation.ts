
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logEventFlow } from '@/utils/events';

/**
 * Custom hook for handling form validation logic
 * @returns Validation related state and functions
 */
export function useEventFormValidation() {
  // Validation state
  const [formError, setFormError] = useState<string | null>(null);
  const [validationChecked, setValidationChecked] = useState(false);

  /**
   * Validates form data
   * @param name Event name
   * @param date Event date
   * @returns Error message if invalid, null if valid
   */
  const validateForm = (name: string, date: Date | undefined): string | null => {
    if (!name) {
      return "Please provide an event name.";
    }
    
    if (!date) {
      return "Please select a date for the event.";
    }
    
    if (name.length < 3) {
      return "Event name must be at least 3 characters long.";
    }
    
    return null;
  };

  /**
   * Checks if session is valid
   * @returns Object containing session and error information
   */
  const checkAuthSession = async () => {
    const { data, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logEventFlow('EventForm', 'Authentication error', sessionError);
      return { 
        session: null, 
        error: "Authentication error. Please try logging in again." 
      };
    }
    
    if (!data.session?.user?.id) {
      logEventFlow('EventForm', 'No authenticated user found');
      return { 
        session: null, 
        error: "No authenticated user found. Please log in and try again." 
      };
    }
    
    return { 
      session: data.session, 
      error: null 
    };
  };

  return {
    formError,
    setFormError,
    validationChecked,
    setValidationChecked,
    validateForm,
    checkAuthSession
  };
}
