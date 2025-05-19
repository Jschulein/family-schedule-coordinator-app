
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/contexts/EventContext";
import { useRefreshEvents } from "./useRefreshEvents";
import { useEventSubmission } from "./useEventSubmission";
import { usePageTracking } from "./usePageTracking";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook for managing the New Event page state and logic
 * Enhanced authentication handling with improved error recovery
 */
export function useNewEventPage() {
  const navigate = useNavigate();
  const { addEvent, refetchEvents } = useEvents();
  const { isSessionReady, validateAuthSession } = useAuth();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionCheckAttempts, setSessionCheckAttempts] = useState(0);
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [canCreateEvents, setCanCreateEvents] = useState<boolean | null>(null);
  
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
  
  // Check if the secure event creation function is available
  useEffect(() => {
    const checkEventCreation = async () => {
      try {
        const { data, error } = await supabase.rpc('can_create_event');
        if (error) {
          console.error("Error checking event creation capability:", error);
          setCanCreateEvents(false);
        } else {
          setCanCreateEvents(!!data);
        }
      } catch (err) {
        console.error("Exception checking event creation capability:", err);
        setCanCreateEvents(false);
      }
    };
    
    checkEventCreation();
  }, []);

  // Enhanced session check with longer timeout and validation attempts
  useEffect(() => {
    // Initial state is checking
    setIsCheckingSession(true);
    
    // Clear any existing timeout
    if (sessionCheckTimeoutRef.current) {
      clearTimeout(sessionCheckTimeoutRef.current);
    }
    
    // Function to validate the session
    const validateSession = async () => {
      try {
        // Perform a validation check against the auth API
        const isValid = await validateAuthSession();
        
        if (isValid || isSessionReady) {
          // Session is valid, stop checking
          setIsCheckingSession(false);
        } else if (sessionCheckAttempts < 3) {
          // Increment attempt counter
          setSessionCheckAttempts(prev => prev + 1);
          
          // Schedule another check with exponential backoff
          const delay = Math.pow(2, sessionCheckAttempts) * 2000; // 2s, 4s, 8s
          console.log(`Session not ready, retry attempt ${sessionCheckAttempts + 1} in ${delay}ms`);
          
          sessionCheckTimeoutRef.current = setTimeout(validateSession, delay);
        } else {
          // We've reached max attempts, proceed anyway
          console.log('Max session validation attempts reached, proceeding with available auth state');
          setIsCheckingSession(false);
        }
      } catch (error) {
        console.error("Error validating session:", error);
        setIsCheckingSession(false);
      }
    };
    
    // Start validation process
    if (isSessionReady) {
      // If session is already ready, no need to wait
      setIsCheckingSession(false);
    } else {
      // Validate session with initial delay to allow auth context to initialize
      sessionCheckTimeoutRef.current = setTimeout(validateSession, 1000);
    }
    
    // Cleanup function
    return () => {
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current);
      }
    };
  }, [isSessionReady, sessionCheckAttempts, validateAuthSession]);
  
  // If there are session readiness issues, notify the user once checking is complete
  useEffect(() => {
    if (!isCheckingSession) {
      // Show specific message if the secure event creation function is not available
      if (canCreateEvents === false) {
        toast({
          title: "Event Creation",
          description: "Secure event creation is not available. Your database migrations may not be complete.",
          duration: 5000
        });
      }
      // Only show session message if we know secure event creation is available
      else if (canCreateEvents === true && !isSessionReady) {
        toast({
          title: "Authentication Status",
          description: "Your authentication session is still being established. You may need to wait a moment before creating events.",
          duration: 5000
        });
      }
    }
  }, [isSessionReady, isCheckingSession, canCreateEvents]);
  
  // Custom retry handler that also checks auth session
  const handleRetryWithAuth = async () => {
    setIsCheckingSession(true);
    setSessionCheckAttempts(0);
    
    // First try to validate the auth session
    try {
      await validateAuthSession();
    } catch (error) {
      console.error("Error validating session during retry:", error);
    }
    
    // Then refresh events
    handleRetry();
  };
  
  return {
    // State
    isSubmitting,
    isRefreshing,
    error,
    isSessionReady,
    isCheckingSession,
    canCreateEvents,
    
    // Handlers
    handleSubmit,
    handleReturn,
    handleRetry: handleRetryWithAuth
  };
}
