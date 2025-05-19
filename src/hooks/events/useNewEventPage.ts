
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useRefreshEvents } from "./useRefreshEvents";
import { useEventSubmission } from "./useEventSubmission";
import { usePageTracking } from "./usePageTracking";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";

/**
 * Custom hook for managing the New Event page state and logic
 * Simplified approach that relies on AuthContext isSessionReady state
 */
export function useNewEventPage() {
  const navigate = useNavigate();
  const { addEvent, refetchEvents } = useEvents();
  const { isSessionReady } = useAuth();
  
  // Page tracking and navigation
  const { handleReturn } = usePageTracking();
  
  // Event submission handling - passing isSessionReady directly
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
  
  // Combine errors from all sources
  const error = submissionError || refreshError || 
                (!isSessionReady ? "Authentication session is not fully established" : null);
  
  // If there are session readiness issues, notify the user
  useEffect(() => {
    if (!isSessionReady) {
      toast({
        title: "Authentication Status",
        description: "Your authentication session is being established. You may need to wait a moment before creating events.",
        duration: 5000
      });
    }
  }, [isSessionReady]);
  
  return {
    // State
    isSubmitting,
    isRefreshing,
    error,
    isSessionReady,
    
    // Handlers
    handleSubmit,
    handleReturn,
    handleRetry
  };
}
