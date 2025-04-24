
import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types/eventTypes';
import { supabase } from "@/integrations/supabase/client";
import { fetchEventsFromDb } from '@/services/eventService';
import { toast } from "@/components/ui/sonner";

export function useEventData() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchEvents = useCallback(async () => {
    console.log("Fetching events...");
    setLoading(true);
    setError(null);

    try {
      const { events: fetchedEvents, error: fetchError } = await fetchEventsFromDb();
      
      if (fetchError) {
        console.error("Failed to fetch events:", fetchError);
        setError(fetchError);
        toast.error("Unable to fetch events from server");
      } else {
        console.log(`Successfully loaded ${fetchedEvents.length} events`);
        setEvents(fetchedEvents);
        if (fetchedEvents.length === 0) {
          toast.info("No events found. Create your first event!");
        }
      }
    } catch (e: any) {
      console.error("Error in fetchEvents:", e);
      setError("An unexpected error occurred");
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchEvents();

    // Set up a subscription for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        console.log("Auth state changed: SIGNED_IN, fetching events");
        fetchEvents();
      } else if (event === 'SIGNED_OUT') {
        console.log("Auth state changed: SIGNED_OUT, clearing events");
        setEvents([]);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchEvents]);

  return {
    events,
    setEvents,
    loading,
    error,
    refetchEvents: fetchEvents
  };
}
