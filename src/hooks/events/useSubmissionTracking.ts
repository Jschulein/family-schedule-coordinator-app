
import { useRef, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { performanceTracker } from "@/utils/testing/performanceTracker";
import { logEventFlow } from "@/utils/events";

/**
 * Custom hook for tracking form submission and handling submission timeouts
 * @returns Submission tracking utilities and state
 */
export function useSubmissionTracking() {
  // Refs for tracking and cleanup
  const mountedRef = useRef(true);
  const submissionStartTime = useRef<number>(0);
  const submissionTimeoutRef = useRef<number | null>(null);
  const pageSessionId = useRef<string>(`page-${Date.now()}`);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Clear any pending timeouts
      if (submissionTimeoutRef.current) {
        window.clearTimeout(submissionTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Set up a safety timeout for submission
   * @param isSubmitting Current submission state
   * @param setIsSubmitting Function to update submission state
   */
  const setupSubmissionTimeout = (
    isSubmitting: boolean, 
    setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    // Clear any existing timeout
    if (submissionTimeoutRef.current) {
      window.clearTimeout(submissionTimeoutRef.current);
      submissionTimeoutRef.current = null;
    }

    // Only set a new timeout if we're submitting
    if (isSubmitting) {
      submissionTimeoutRef.current = window.setTimeout(() => {
        if (isSubmitting && mountedRef.current) {
          logEventFlow('NewEvent', 'Submission timeout - resetting state');
          setIsSubmitting(false);
          toast({
            title: "Submission timeout",
            description: "The request is taking longer than expected.",
            variant: "default"
          });
        }
      }, 15000); // Extended to 15 seconds to allow for slow networks
    }
  };

  /**
   * Start performance tracking for submission
   * @param name Name for the tracking event
   * @returns Tracking ID for the performance measurement
   */
  const startSubmissionTracking = (name: string) => {
    submissionStartTime.current = performance.now();
    const perfTrackingId = performanceTracker.startMeasure('NewEventPage:eventSubmission', { 
      name
    });
    
    logEventFlow('NewEvent', 'Starting event submission', { 
      name,
      timeStamp: submissionStartTime.current
    });

    return perfTrackingId;
  };

  /**
   * Record submission completion time and log results
   * @param totalTime Total time taken for submission
   * @param perfTrackingId Performance tracking ID to end measurement
   */
  const endSubmissionTracking = (totalTime: number, perfTrackingId: string) => {
    performanceTracker.endMeasure(perfTrackingId);
    
    logEventFlow('NewEvent', 'Event submission process complete', { 
      totalTimeMs: totalTime 
    });
  };

  return {
    mountedRef,
    submissionStartTime,
    pageSessionId,
    setupSubmissionTimeout,
    startSubmissionTracking,
    endSubmissionTracking
  };
}
