
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import AddEventForm from "@/components/AddEventForm";
import { useEvents } from "@/contexts/EventContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const { addEvent, loading: contextLoading, error: contextError, refetchEvents } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      
      if (!data.session) {
        toast.error("You need to be logged in to create events");
        navigate("/auth");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (eventData: EventFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Form submission data:", eventData);
      
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("You need to be logged in to create events");
        navigate("/auth");
        return;
      }
      
      const event = {
        name: eventData.name,
        date: eventData.date,
        end_date: eventData.end_date || eventData.date,
        time: eventData.time,
        description: eventData.description,
        creatorId: data.session.user.id,
        familyMembers: eventData.familyMembers,
        all_day: eventData.all_day
      };
      
      await addEvent(event);
      toast.success("Event created successfully!");
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      toast.error(`Failed to create event: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = () => {
    navigate("/");
  };
  
  const handleRetry = async () => {
    setIsRefreshing(true);
    try {
      await refetchEvents();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isAuthenticated) {
    return <div className="p-8 text-center">Checking authentication...</div>;
  }

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
            className="flex items-center"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
        
        {contextError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error: {contextError}. Please try refreshing the data or contact support.
                </p>
              </div>
            </div>
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
