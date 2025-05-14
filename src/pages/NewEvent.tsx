
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Safety timeout if submission gets stuck
  useEffect(() => {
    if (isSubmitting) {
      const timeoutId = setTimeout(() => {
        if (isSubmitting && mountedRef.current) {
          setIsSubmitting(false);
          toast({
            title: "Submission timeout",
            description: "The request is taking longer than expected.",
            variant: "default"
          });
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
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
    logEventFlow('NewEvent', 'Starting event submission', { 
      name: eventData.name,
      formSubmitting: isSubmitting
    });
    
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add the event
      const createdEvent = await addEvent(eventData as Event);
      
      if (createdEvent) {
        navigate("/calendar");
      } else {
        // Error was already handled in the addEvent function
        if (mountedRef.current) {
          setIsSubmitting(false);
        }
      }
    } catch (error: any) {
      logEventFlow('NewEvent', 'Error during submission', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create event",
        variant: "destructive"
      });
      
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleReturn = () => {
    navigate("/");
  };
  
  const handleRetry = async () => {
    // Handle data refresh
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
      setError(error?.message || "Failed to refresh data");
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
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
