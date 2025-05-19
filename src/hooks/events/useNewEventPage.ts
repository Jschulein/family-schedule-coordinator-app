
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useRefreshEvents } from "./useRefreshEvents";
import { useEventSubmission } from "./useEventSubmission";
import { usePageTracking } from "./usePageTracking";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState, useRef } from "react";

/**
 * Custom hook for managing the New Event page state and logic
 * Enhanced session management with improved timeout handling
 */
export function useNewEventPage() {
  const navigate = useNavigate();
  const { addEvent, refetchEvents } = useEvents();
  const { isSessionReady } = useAuth();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
                (!isSessionReady && !isCheckingSession ? "Authentication session is not fully established" : null);
  
  // Enhanced session check with longer timeout and synchronization with isSessionReady
  useEffect(() => {
    // Initial state is checking
    setIsCheckingSession(true);
    
    // Clear any existing timeout
    if (sessionCheckTimeoutRef.current) {
      clearTimeout(sessionCheckTimeoutRef.current);
    }
    
    // Wait for isSessionReady to become true or timeout after a reasonable period
    if (isSessionReady) {
      // If session is already ready, no need to wait
      setIsCheckingSession(false);
    } else {
      // Set a longer timeout to give authentication more time to establish
      sessionCheckTimeoutRef.current = setTimeout(() => {
        if (!isSessionReady) {
          console.log('Session check timeout reached, proceeding with available auth state');
          setIsCheckingSession(false);
        }
      }, 8000); // Extended timeout (8 seconds) to give auth more time
    }
    
    // Cleanup function
    return () => {
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
      }
    };
  }, [isSessionReady]);
  
  // If there are session readiness issues, notify the user once checking is complete
  useEffect(() => {
    if (!isSessionReady && !isCheckingSession) {
      toast({
        title: "Authentication Status",
        description: "Your authentication session is still being established. You may need to wait a moment before creating events.",
        duration: 5000
      });
    }
  }, [isSessionReady, isCheckingSession]);
  
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
