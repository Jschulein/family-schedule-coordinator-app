
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useRefreshEvents } from "./useRefreshEvents";
import { useEventSubmission } from "./useEventSubmission";
import { usePageTracking } from "./usePageTracking";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

/**
 * Custom hook for managing the New Event page state and logic
 * Now uses the consolidated AuthContext for session management
 */
export function useNewEventPage() {
  const navigate = useNavigate();
  const { addEvent, refetchEvents } = useEvents();
  const { isSessionReady } = useAuth();
  
  // Local state for session checking
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // Page tracking and navigation
  const { handleReturn } = usePageTracking();
  
  // Validate session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);
        // Session info is already available in AuthContext
        // We just use this for UI feedback
        setIsCheckingSession(false);
      } catch (err: any) {
        console.error("Error checking session:", err);
        setSessionError(err?.message || "Unable to validate authentication session");
        setIsCheckingSession(false);
      }
    };
    
    if (!isSessionReady) {
      checkSession();
    }
  }, [isSessionReady]);
  
  // Notify user if there are session readiness issues
  useEffect(() => {
    if (sessionError && !isCheckingSession) {
      toast({
        title: "Authentication Issue",
        description: "There may be issues with your authentication session. If you encounter problems creating events, please try refreshing the page.",
        variant: "default", // Changed from "warning" to "default"
        duration: 5000
      });
    }
  }, [sessionError, isCheckingSession]);
  
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
