
import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types/eventTypes';
import { supabase } from "@/integrations/supabase/client";
import { fetchEventsFromDb } from '@/services/events';
import { toast } from "@/components/ui/use-toast";

/**
 * Custom hook for fetching and managing event data
 * Optimized for error handling and performance
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
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Using our improved event fetching function that handles recursion errors
      const { events: fetchedEvents, error: fetchError } = await fetchEventsFromDb();
      
      if (fetchError) {
        console.error("Failed to fetch events:", fetchError);
        setError(fetchError);
        if (showToast) {
          toast({ 
            title: "Error", 
            description: "Unable to fetch events from server. Using available local data.", 
            variant: "destructive" 
          });
        }
      } else {
        console.log(`Successfully loaded ${fetchedEvents.length} events`);
        setEvents(fetchedEvents);
      }
    } catch (e: any) {
      console.error("Error in fetchEvents:", e);
      setError("An unexpected error occurred");
      if (showToast) {
        toast({ 
          title: "Error", 
          description: "Failed to load events. Please try again later.", 
          variant: "destructive" 
        });
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [events.length]);

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
