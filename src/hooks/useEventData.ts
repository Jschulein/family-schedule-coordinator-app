
import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types/eventTypes';
import { supabase } from "@/integrations/supabase/client";
import { fetchEventsFromDb } from '@/services/events';
import { toast } from "@/hooks/use-toast";

export function useEventData() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchEvents = useCallback(async () => {
    console.log("Fetching events...");
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found");
        setEvents([]);
        setLoading(false);
        return;
      }

      // Using the improved RLS policies that avoid recursion
      const { events: fetchedEvents, error: fetchError } = await fetchEventsFromDb();
      
      if (fetchError) {
        console.error("Failed to fetch events:", fetchError);
        setError(fetchError);
        toast({ title: "Error", description: "Unable to fetch events from server" });
      } else {
        console.log(`Successfully loaded ${fetchedEvents.length} events`);
        setEvents(fetchedEvents);
      }
    } catch (e: any) {
      console.error("Error in fetchEvents:", e);
      setError("An unexpected error occurred");
      toast({ title: "Error", description: "Failed to load events" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up subscriptions to real-time updates for events and event_families tables
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Subscribe to events table changes
      const eventsChannel = supabase
        .channel('events-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'events' }, 
          (payload) => {
            console.log('Events change received:', payload);
            // Refresh events when changes occur
            fetchEvents();
          }
        )
        .subscribe();
        
      // Subscribe to event_families table changes
      const eventFamiliesChannel = supabase
        .channel('event-families-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'event_families' }, 
          (payload) => {
            console.log('Event families change received:', payload);
            // Refresh events when family sharing changes
            fetchEvents();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(eventsChannel);
        supabase.removeChannel(eventFamiliesChannel);
      };
    };
    
    setupRealtimeSubscriptions();
  }, [fetchEvents]);

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
