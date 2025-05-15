
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useEvents } from "@/contexts/EventContext";
import { Event } from "@/types/eventTypes";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";

/**
 * Custom hook for managing the New Event page state and logic
 * Separates business logic from the UI component
 */
export function useNewEventPage() {
  const navigate = useNavigate();
  const { addEvent, refetchEvents } = useEvents();
  
  // Form submission state - completely separate from data loading
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for tracking and cleanup
  const mountedRef = useRef(true);
  const submissionStartTime = useRef<number>(0);
  const pageSessionId = useRef<string>(`page-${Date.now()}`);
  const submissionTimeoutRef = useRef<number | null>(null);
  
  // Start performance tracking
  useEffect(() => {
    const trackId = performanceTracker.startMeasure('NewEventPage:mount', {
      sessionId: pageSessionId.current
    });
    
    return () => {
      performanceTracker.endMeasure(trackId);
    };
  }, []);
  
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
  
  // Safety timeout if submission gets stuck
  useEffect(() => {
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
      
      return () => {
        if (submissionTimeoutRef.current) {
          window.clearTimeout(submissionTimeoutRef.current);
        }
      };
    }
  }, [isSubmitting]);

  /**
   * Handle form submission
   * This is completely separate from data loading
   */
  const handleSubmit = async (eventData: any) => {
    // Start performance tracking
    submissionStartTime.current = performance.now();
    const perfTrackingId = performanceTracker.startMeasure('NewEventPage:eventSubmission', { 
      name: eventData.name
    });
    
    logEventFlow('NewEvent', 'Starting event submission', { 
      name: eventData.name,
      formSubmitting: isSubmitting
    });
    
    // Prevent double-submissions with a guard
    if (isSubmitting) {
      logEventFlow('NewEvent', 'Submission prevented - already submitting');
      return;
    }
    
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
      performanceTracker.endMeasure(perfTrackingId);
      
      logEventFlow('NewEvent', 'Event submission process complete', { 
        totalTimeMs: totalTime 
      });
      
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

  /**
   * Handle return button click
   * Navigates back to home page
   */
  const handleReturn = () => {
    navigate("/");
  };
  
  /**
   * Handle retry button click
   * Refreshes event data
   */
  const handleRetry = async () => {
    // Handle data refresh with performance tracking
    const refreshTrackingId = performanceTracker.startMeasure('NewEventPage:dataRefresh');
    
    setIsRefreshing(true);
    setError(null);
    logEventFlow('NewEvent', 'Manual data refresh requested');
    
    try {
      await refetchEvents(true);
      
      toast({
        title: "Success",
        description: "Data refreshed successfully",
        variant: "default"
      });
    } catch (error: any) {
      logEventFlow('NewEvent', 'Error refreshing data', error);
      
      if (mountedRef.current) {
        setError(error?.message || "Failed to refresh data");
        
        toast({
          title: "Error",
          description: "Failed to refresh data",
          variant: "destructive"
        });
      }
    } finally {
      performanceTracker.endMeasure(refreshTrackingId);
      
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

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
