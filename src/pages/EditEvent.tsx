
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import EditEventForm from "@/components/EditEventForm";
import { useEvents } from "@/contexts/EventContext";
import { Event } from "@/types/eventTypes";
import { supabase } from "@/integrations/supabase/client";

const EditEvent = () => {
  // Updated to match the router path parameter
  const { id: eventId } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { events, updateEvent, deleteEvent, loading: contextLoading, error: contextError } = useEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("EditEvent page loaded with eventId:", eventId);
    console.log("Available events:", events.map(e => e.id));
    
    // Get the event from the context
    if (events.length > 0 && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        console.log("Found event:", foundEvent);
        setEvent(foundEvent);
        setIsLoading(false);
      } else {
        console.log("Event not found with id:", eventId);
        setError("Event not found");
        setIsLoading(false);
      }
    } else if (!contextLoading && events.length === 0) {
      setIsLoading(false);
      setError("No events available");
    }
  }, [events, eventId, contextLoading]);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth error:", error);
          toast.error("Authentication error. Please try logging in again.");
          navigate("/auth");
          return;
        }
        
        if (!data.session) {
          toast.error("You need to be logged in to edit events");
          navigate("/auth");
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        toast.error("Failed to verify authentication status");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (eventData: Event) => {
    try {
      setIsSubmitting(true);
      await updateEvent(eventData);
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast.error(`Failed to update event: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteEvent(id);
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast.error(`Failed to delete event: ${error.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate("/calendar");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              className="mr-4" 
              onClick={() => navigate("/calendar")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return
            </Button>
            <h1 className="text-4xl font-bold text-gray-900">
              Edit Event
            </h1>
          </div>
        </div>
        
        {contextError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error: {contextError}. Please try refreshing the page or contact support.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading event...</p>
            </div>
          ) : event ? (
            <EditEventForm 
              event={event}
              onSubmit={handleSubmit} 
              onDelete={handleDelete}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              isDeleting={isDeleting}
            />
          ) : (
            <div className="text-center">
              <p className="mb-4">Event not found or you don't have permission to edit it.</p>
              <Button 
                variant="outline" 
                onClick={() => navigate("/calendar")}
              >
                Return to Calendar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
