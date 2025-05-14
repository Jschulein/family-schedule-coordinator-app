
import { useState, useEffect, useCallback } from 'react';
import { Event } from '@/types/eventTypes';
import { supabase } from "@/integrations/supabase/client";
import { fetchEventsFromDb } from '@/services/events';
import { toast } from "@/components/ui/use-toast";
import { logEventFlow } from '@/utils/events';

/**
 * Custom hook for fetching and managing event data
 * Using the optimized security definer functions to avoid recursion
 */
export function useEventData() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  
  // Check for cached events in localStorage on initial load
  useEffect(() => {
    logEventFlow('useEventData', 'Hook initialized');
    
    const cachedEventsJson = localStorage.getItem('cachedEvents');
    const cachedTimestamp = localStorage.getItem('cachedEventsTimestamp');
    
    if (cachedEventsJson) {
      try {
        const parsedEvents = JSON.parse(cachedEventsJson);
        setEvents(parsedEvents);
        logEventFlow('useEventData', `Loaded ${parsedEvents.length} events from cache`);
        
        // Only set loading to false if cache is relatively fresh (< 1 hour)
        if (cachedTimestamp && (Date.now() - Number(cachedTimestamp) < 3600000)) {
          setLoading(false);
        }
      } catch (e) {
        logEventFlow('useEventData', 'Failed to parse cached events', e);
      }
    }
  }, []);
  
  // Memoized fetch function to prevent unnecessary rerenders
  const fetchEvents = useCallback(async (showToast = true) => {
    logEventFlow('useEventData', 'Fetching events...');
    
    // Set refreshing state if we already have data to show a refresh state
    // rather than a full loading state
    if (events.length > 0) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    setOfflineMode(false);

    try {
      // Using our simplified approach with security definer function
      const { events: fetchedEvents, error: fetchError } = await fetchEventsFromDb();
      
      if (fetchError) {
        logEventFlow('useEventData', 'Failed to fetch events', fetchError);
        setError(fetchError);
        setOfflineMode(true);
        
        if (showToast) {
          toast({ 
            title: "Error", 
            description: "Unable to fetch events. Using available local data.", 
            variant: "destructive" 
          });
        }
        // Keep existing events if we have them
      } else if (fetchedEvents) {
        logEventFlow('useEventData', `Successfully loaded ${fetchedEvents.length} events`);
        setEvents(fetchedEvents);
        setError(null);
        
        // Cache the events for offline use
        try {
          localStorage.setItem('cachedEvents', JSON.stringify(fetchedEvents));
          localStorage.setItem('cachedEventsTimestamp', Date.now().toString());
        } catch (e) {
          logEventFlow('useEventData', 'Failed to cache events', e);
        }
        
        setLastFetchTime(Date.now());
      }
    } catch (e: any) {
      logEventFlow('useEventData', 'Error in fetchEvents', e);
      setError("An unexpected error occurred");
      setOfflineMode(true);
      
      if (showToast) {
        toast({ 
          title: "Error", 
          description: "Failed to load events. Using local data.", 
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
        logEventFlow('useEventData', "Auth state changed: SIGNED_IN, fetching events");
        fetchEvents();
      } else if (event === 'SIGNED_OUT') {
        logEventFlow('useEventData', "Auth state changed: SIGNED_OUT, clearing events");
        setEvents([]);
        localStorage.removeItem('cachedEvents');
        localStorage.removeItem('cachedEventsTimestamp');
      }
    });
    
    // Set up periodic refresh (every 5 minutes if tab is active)
    let refreshInterval: number | undefined;
    
    const setupRefreshInterval = () => {
      refreshInterval = window.setInterval(() => {
        // Only refresh if user is active and last fetch was > 5 minutes ago
        if (document.visibilityState === 'visible' && 
            (!lastFetchTime || (Date.now() - lastFetchTime > 300000))) {
          logEventFlow('useEventData', "Auto-refreshing events data");
          fetchEvents(false); // Don't show toast for auto-refresh
        }
      }, 300000); // 5 minutes
    };
    
    setupRefreshInterval();
    
    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When tab becomes active, check if we need a refresh
        if (lastFetchTime && (Date.now() - lastFetchTime > 300000)) {
          logEventFlow('useEventData', "Tab active, refreshing stale data");
          fetchEvents(false); // Don't show toast for visibility-based refresh
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      if (refreshInterval) clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      logEventFlow('useEventData', "Hook cleanup");
    };
  }, [fetchEvents, lastFetchTime]);

  return {
    events,
    setEvents,
    loading,
    isRefreshing,
    error,
    offlineMode,
    refetchEvents: fetchEvents
  };
}
