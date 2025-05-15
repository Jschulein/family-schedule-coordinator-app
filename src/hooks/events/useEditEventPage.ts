
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useEvents } from "@/contexts/EventContext";
import { Event } from "@/types/eventTypes";
import { fetchEventById } from "@/services/events";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook for managing the Edit Event page
 * Centralizes the logic for fetching, updating, and deleting events
 */
export function useEditEventPage() {
  // Router and context hooks
  const { id: eventId } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { 
    events, 
    updateEvent, 
    deleteEvent, 
    loading: contextLoading, 
    error: contextError 
  } = useEvents();
  
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check authentication status on component mount
   */
  useEffect(() => {
    checkAuthStatus();
  }, [navigate]);

  /**
   * Load event data on component mount or when eventId/events change
   */
  useEffect(() => {
    loadEventData();
  }, [eventId, events]);

  /**
   * Verifies that the user is authenticated
   * Redirects to login if not authenticated
   */
  const checkAuthStatus = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth error:", error);
        toast({
          title: "Authentication error",
          description: "Please try logging in again.",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }
      
      if (!data.session) {
        toast({
          title: "Authentication required", 
          description: "You need to be logged in to edit events",
          variant: "destructive"
        });
        navigate("/auth");
      }
    } catch (err) {
      console.error("Error checking auth:", err);
      toast({
        title: "Error",
        description: "Failed to verify authentication status",
        variant: "destructive"
      });
    }
  };

  /**
   * Loads event data from context or database
   */
  const loadEventData = async () => {
    if (!eventId) {
      setError("No event ID provided");
      setIsLoading(false);
      return;
    }
    
    try {
      // Try to get the event from the context first for faster loading
      const contextEvent = events.find(e => e.id === eventId);
      if (contextEvent) {
        console.log("Found event in context:", contextEvent);
        setEvent(contextEvent);
        setIsLoading(false);
        return;
      }
      
      // If not in context, fetch directly from the database
      console.log("Fetching event from database");
      const { event: fetchedEvent, error: fetchError } = await fetchEventById(eventId);
      
      if (fetchError) {
        console.error("Error fetching event:", fetchError);
        setError(fetchError);
        setIsLoading(false);
        return;
      }
      
      if (!fetchedEvent) {
        console.log("Event not found with id:", eventId);
        setError("Event not found");
        setIsLoading(false);
        return;
      }
      
      console.log("Successfully fetched event:", fetchedEvent);
      setEvent(fetchedEvent);
    } catch (err) {
      console.error("Unexpected error loading event:", err);
      setError("Failed to load event");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle event update submission
   */
  const handleSubmit = async (eventData: Event) => {
    try {
      setIsSubmitting(true);
      await updateEvent(eventData);
      toast({
        title: "Success",
        description: "Event updated successfully!"
      });
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: `Failed to update event: ${error.message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle event deletion
   */
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteEvent(id);
      toast({
        title: "Success",
        description: "Event deleted successfully!"
      });
      navigate("/calendar");
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: `Failed to delete event: ${error.message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    navigate("/calendar");
  };

  return {
    // State
    event,
    isLoading,
    isSubmitting,
    isDeleting,
    error,
    contextError,
    
    // Handlers
    handleSubmit,
    handleDelete,
    handleCancel
  };
}
