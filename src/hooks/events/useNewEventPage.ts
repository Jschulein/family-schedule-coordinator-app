
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useRefreshEvents } from "./useRefreshEvents";
import { useEventSubmission } from "./useEventSubmission";
import { usePageTracking } from "./usePageTracking";
import { useSessionReady } from "@/hooks/auth/useSessionReady";
import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";

/**
 * Custom hook for managing the New Event page state and logic
 * Enhanced with session readiness checking
 */
export function useNewEventPage() {
  const navigate = useNavigate();
  const { addEvent, refetchEvents } = useEvents();
  
  // Page tracking and navigation
  const { handleReturn } = usePageTracking();
  
  // Session readiness check
  const { isSessionReady, isCheckingSession, sessionError } = useSessionReady();
  
  // Notify user if there are session readiness issues
  useEffect(() => {
    if (sessionError && !isCheckingSession) {
      toast({
        title: "Authentication Issue",
        description: "There may be issues with your authentication session. If you encounter problems creating events, please try refreshing the page.",
        variant: "warning",
        duration: 5000
      });
    }
  }, [sessionError, isCheckingSession]);
  
  // Event submission handling, now with session awareness
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
                (!isSessionReady && !isCheckingSession ? "Authentication session is not fully established" : null);
  
  return {
    // State
    isSubmitting,
    isRefreshing,
    error,
    isSessionReady,
    isCheckingSession,
    
    // Handlers
    handleSubmit,
    handleReturn,
    handleRetry
  };
}
