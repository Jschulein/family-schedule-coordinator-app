
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useRefreshEvents } from "./useRefreshEvents";
import { useEventSubmission } from "./useEventSubmission";
import { usePageTracking } from "./usePageTracking";

/**
 * Custom hook for managing the New Event page state and logic
 * Combines smaller hooks for better organization
 */
export function useNewEventPage() {
  const navigate = useNavigate();
  const { addEvent, refetchEvents } = useEvents();
  
  // Page tracking and navigation
  const { handleReturn } = usePageTracking();
  
  // Event submission handling
  const { 
    isSubmitting,
    error: submissionError,
    handleSubmit
  } = useEventSubmission(addEvent);
  
  // Data refresh handling
  const {
    isRefreshing,
    error: refreshError,
    handleRetry
  } = useRefreshEvents(refetchEvents);
  
  // Combine errors from both sources
  const error = submissionError || refreshError;
  
  return {
    // State
    isSubmitting,
    isRefreshing,
    error,
    
    // Handlers
    handleSubmit,
    handleReturn,
    handleRetry
  };
}
