
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import AddEventForm from "@/components/AddEventForm";
import { useEvents } from "@/contexts/EventContext";
import { useState, useEffect, useRef } from "react";
import { Event } from "@/types/eventTypes";
import { useFamilyContext } from "@/contexts/family";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";

interface EventFormData {
  name: string;
  date: Date;
  end_date?: Date;
  time: string;
  description: string;
  creatorId: string;
  familyMembers: string[];
  all_day: boolean;
}

const NewEvent = () => {
  const navigate = useNavigate();
  const { addEvent, loading: contextLoading, refetchEvents } = useEvents();
  const { activeFamilyId, families } = useFamilyContext();
  
  // State for tracking submission and error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  
  // Refs for tracking
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
  
  // Show family selection reminder
  useEffect(() => {
    if (families.length > 0 && !activeFamilyId) {
      toast({
        title: "Family selection needed",
        description: "Please select a family to share this event with",
        variant: "default"
      });
    }
  }, [families, activeFamilyId]);

  const handleSubmit = async (eventData: EventFormData) => {
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
      const eventCreationData = await performanceTracker.measure(
        'NewEventPage:addEventAPICall',
        async () => {
          return await addEvent(eventData as Event);
        },
        { eventName: eventData.name }
      );
      
      const createdEvent = eventCreationData;
      
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

  const handleReturn = () => {
    navigate("/");
  };
  
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="mr-4" 
              onClick={handleReturn}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return
            </Button>
            <h1 className="text-4xl font-bold text-gray-900">
              Add New Event
            </h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRetry}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
        
        {!activeFamilyId && families.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
            <p className="font-medium text-amber-800">Select a family</p>
            <p className="text-sm text-amber-700">
              Please select a family from the sidebar to share this event with family members.
            </p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <div className="flex justify-center">
          <AddEventForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting || contextLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default NewEvent;
