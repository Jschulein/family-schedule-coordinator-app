
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Event } from "@/types/eventTypes";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";
import { useSubmissionTracking } from "./useSubmissionTracking";

/**
 * Custom hook for handling event submission logic
 * @param addEvent Function to add a new event
 * @returns State and handler for event submission
 */
export function useEventSubmission(addEvent: (event: Event) => Promise<Event | undefined>) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get submission tracking utilities
  const {
    mountedRef,
    submissionStartTime,
    startSubmissionTracking,
    setupSubmissionTimeout,
    endSubmissionTracking
  } = useSubmissionTracking();
  
  // Set up submission timeout whenever submission state changes
  useState(() => {
    setupSubmissionTimeout(isSubmitting, setIsSubmitting);
    return () => setIsSubmitting(false);
  });

  /**
   * Handle form submission
   * Manages submission state and error handling
   */
  const handleSubmit = async (eventData: any) => {
    // Prevent double-submissions with a guard
    if (isSubmitting) {
      logEventFlow('NewEvent', 'Submission prevented - already submitting');
      return;
    }
    
    // Start performance tracking
    const perfTrackingId = startSubmissionTracking(eventData.name);
    
    // Clear any existing errors and set submitting state
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Track the API call separately
      const createdEvent = await performanceTracker.measure(
        'NewEventPage:addEventAPICall',
        async () => {
          return await addEvent(eventData as Event);
        },
        { eventName: eventData.name }
      );
      
      if (createdEvent) {
        // Track success and navigation time
        performanceTracker.measure('NewEventPage:eventCreationSuccess', () => {
          logEventFlow('NewEvent', 'Event created successfully, navigating to calendar');
          
          // Only navigate if component is still mounted
          if (mountedRef.current) {
            navigate("/calendar");
          }
        });
      } else {
        // Error was already handled in the addEvent function
        if (mountedRef.current) {
          logEventFlow('NewEvent', 'Event creation failed without error');
          setIsSubmitting(false);
        }
      }
    } catch (error: any) {
      // Track and log error details
      performanceTracker.measure('NewEventPage:eventCreationError', 
        () => {
          logEventFlow('NewEvent', 'Error during submission', error);
          
          if (mountedRef.current) {
            setError(error?.message || "Failed to create event");
            toast({
              title: "Error",
              description: error?.message || "Failed to create event",
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
      if (mountedRef.current && isSubmitting) {
        // Use a short timeout to avoid race conditions with state updates
        setTimeout(() => {
          if (mountedRef.current && isSubmitting) {
            setIsSubmitting(false);
          }
        }, 100);
      }
    }
  };

  return {
    isSubmitting,
    error,
    setError,
    handleSubmit
  };
}
