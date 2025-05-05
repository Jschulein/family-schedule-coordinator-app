
import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types/eventTypes';
import { supabase } from "@/integrations/supabase/client";
import { fetchEventsFromDb } from '@/services/events';
import { toast } from "@/hooks/use-toast";

/**
 * Custom hook for fetching and managing event data
 * Optimized for performance with caching and realtime updates
 */
export function useEventData() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Memoized fetch function to prevent unnecessary rerenders
  const fetchEvents = useCallback(async (showToast = true) => {
    console.log("Fetching events...");
    
    // Set refreshing state if we already have data to show a refresh state
    // rather than a full loading state
    if (events.length > 0) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found");
        setEvents([]);
        return;
      }

      // Using the improved RLS policies that avoid recursion
      const { events: fetchedEvents, error: fetchError } = await fetchEventsFromDb();
      
      if (fetchError) {
        console.error("Failed to fetch events:", fetchError);
        setError(fetchError);
        if (showToast) {
          toast({ title: "Error", description: "Unable to fetch events from server" });
        }
      } else {
        console.log(`Successfully loaded ${fetchedEvents.length} events`);
        setEvents(fetchedEvents);
      }
    } catch (e: any) {
      console.error("Error in fetchEvents:", e);
      setError("An unexpected error occurred");
      if (showToast) {
        toast({ title: "Error", description: "Failed to load events" });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [events.length]);

  // Set up subscriptions to real-time updates for events and event_families tables
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      console.log("Setting up realtime subscriptions for events");
      
      // Subscribe to events table changes
      const eventsChannel = supabase
        .channel('events-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'events' }, 
          (payload) => {
            console.log('Events change received:', payload.eventType);
            // Refresh events when changes occur
            fetchEvents(false); // Don't show toast on realtime updates
          }
        )
        .subscribe();
        
      // Subscribe to event_families table changes
      const eventFamiliesChannel = supabase
        .channel('event-families-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'event_families' }, 
          (payload) => {
            console.log('Event families change received:', payload.eventType);
            // Refresh events when family sharing changes
            fetchEvents(false); // Don't show toast on realtime updates
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

  // Initial fetch and auth state subscription
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
    isRefreshing,
    error,
    refetchEvents: fetchEvents
  };
}
