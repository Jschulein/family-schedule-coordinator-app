
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Event } from "@/types/eventTypes";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";
import { useSubmissionTracking } from "./useSubmissionTracking";
import { handleError } from "@/utils/error";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Custom hook for handling event submission logic with improved error recovery
 * Now uses the consolidated AuthContext for session management
 * @param addEvent Function to add a new event
 * @returns State and handler for event submission
 */
export function useEventSubmission(addEvent: (event: Event) => Promise<Event | undefined>) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { isSessionReady, validateAuthSession } = useAuth();
  
  // Get submission tracking utilities
  const {
    mountedRef,
    submissionStartTime,
    startSubmissionTracking,
    setupSubmissionTimeout,
    endSubmissionTracking
  } = useSubmissionTracking();
  
  // State for tracking session validation in progress
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  
  // Set up submission timeout whenever submission state changes
  useEffect(() => {
    setupSubmissionTimeout(isSubmitting, setIsSubmitting);
    return () => setIsSubmitting(false);
  }, [isSubmitting, setupSubmissionTimeout]);

  // Cleanup function to abort any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Handle form submission with improved error recovery
   * Manages submission state and error handling
   */
  const handleSubmit = async (eventData: any) => {
    // Prevent double-submissions with a guard
    if (isSubmitting) {
      logEventFlow('NewEvent', 'Submission prevented - already submitting');
      return;
    }
    
    // Check session readiness or validate explicitly
    let sessionValid = isSessionReady;
    
    if (!sessionValid) {
      setIsCheckingSession(true);
      try {
        // Direct session validation as fallback
        sessionValid = await validateAuthSession();
      } catch (err) {
        console.error("Session validation error:", err);
      } finally {
        setIsCheckingSession(false);
      }
    }
    
    // If session isn't valid, show an error
    if (!sessionValid) {
      logEventFlow('NewEvent', 'Submission prevented - authentication not fully established');
      setError("Your authentication session is not fully established. Please wait a moment and try again.");
      toast({
        title: "Not Ready",
        description: "Your authentication session is not fully established. Please wait a moment and try again.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a new AbortController for this submission
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Start performance tracking
    const perfTrackingId = startSubmissionTracking(eventData.name);
    
    // Clear any existing errors and set submitting state
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Check if the submission was aborted
      if (signal.aborted) {
        throw new Error("Submission was cancelled");
      }
      
      // Track the API call separately
      const createdEvent = await performanceTracker.measure(
        'NewEventPage:addEventAPICall',
        async () => {
          return await addEvent(eventData as Event);
        },
        { eventName: eventData.name }
      );
      
      // Check again if aborted after the API call
      if (signal.aborted) {
        throw new Error("Submission was cancelled during API call");
      }
      
      if (createdEvent) {
        // Track success and navigation time
        performanceTracker.measure('NewEventPage:eventCreationSuccess', () => {
          logEventFlow('NewEvent', 'Event created successfully, navigating to calendar');
          
          // Only navigate if component is still mounted
          if (mountedRef.current && !signal.aborted) {
            toast({
              title: "Success",
              description: `Event "${eventData.name}" was created successfully!`
            });
            navigate("/calendar");
          }
        });
      } else {
        // Error was already handled in the addEvent function
        if (mountedRef.current && !signal.aborted) {
          logEventFlow('NewEvent', 'Event creation failed without error');
          setIsSubmitting(false);
        }
      }
    } catch (error: any) {
      // Skip error handling if aborted intentionally
      if (error.name === 'AbortError') {
        logEventFlow('NewEvent', 'Submission aborted intentionally');
        return;
      }
    
      // Check if this is an authentication error
      const isAuthError = error.message?.includes?.('authentication') || 
                          error.message?.includes?.('policy') ||
                          error.message?.includes?.('permission') ||
                          error.message?.includes?.('auth');
      
      // Track and log error details
      performanceTracker.measure('NewEventPage:eventCreationError', 
        () => {
          logEventFlow('NewEvent', 'Error during submission', error);
          
          if (mountedRef.current) {
            let errorMessage = handleError(error, {
              context: 'Event Creation',
              showToast: false
            });
            
            // Add more helpful information for auth errors
            if (isAuthError) {
              errorMessage += " This may be due to an authentication synchronization issue. Please try again in a moment.";
            }
            
            setError(errorMessage);
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive"
            });
          }
        }
      );
      
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    } finally {
      // End performance tracking
      const totalTime = performance.now() - submissionStartTime.current;
      
      endSubmissionTracking(totalTime, perfTrackingId);
      
      // Safety measure if the component is still mounted but we never reset isSubmitting
      if (mountedRef.current && isSubmitting && !signal.aborted) {
        // Use a short timeout to avoid race conditions with state updates
        setTimeout(() => {
          if (mountedRef.current && isSubmitting) {
            setIsSubmitting(false);
          }
        }, 100);
      }
      
      // Clear the abort controller reference
      abortControllerRef.current = null;
    }
  };

  /**
   * Cancels the current submission if one is in progress
   */
  const cancelSubmission = () => {
    if (abortControllerRef.current && isSubmitting) {
      abortControllerRef.current.abort();
      setIsSubmitting(false);
      setError("Submission cancelled");
      logEventFlow('NewEvent', 'Submission cancelled by user');
    }
  };

  return {
    isSubmitting,
    error,
    setError,
    handleSubmit,
    cancelSubmission,
    isSessionReady,
    isCheckingSession
  };
}
