import { useState, useEffect, useCallback, useRef } from 'react';
import { Event } from '@/types/eventTypes';
import { supabase } from "@/integrations/supabase/client";
import { logEventFlow } from '@/utils/events';
import { 
  fetchEventData, 
  cacheEvents, 
  loadCachedEvents, 
  isCacheFresh,
  clearCachedEvents
} from '@/utils/events/eventDataFetching';

/**
 * Custom hook for fetching and managing event data
 * Uses optimized security definer functions to avoid recursion
 * 
 * Loading states:
 * - initialLoading: True when events are being loaded for the first time
 * - isRefreshing: True when events are being refreshed but we already have data to show
 * - operationLoading: True when a data operation is in progress (not related to form submission)
 */
export function useEventData() {
  // Data state
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  
  // Loading states - clearly separated for different purposes
  const [initialLoading, setInitialLoading] = useState<boolean>(true); // First load only
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);    // Refresh of existing data
  const [operationLoading, setOperationLoading] = useState<boolean>(false); // General operations
  
  // Use a ref to track component mounted state for cleanup
  const isMounted = useRef<boolean>(true);
  
  // Check for cached events in localStorage on initial load
  useEffect(() => {
    logEventFlow('useEventData', 'Hook initialized');
    
    const { events: cachedEvents, timestamp } = loadCachedEvents();
    
    if (cachedEvents) {
      setEvents(cachedEvents);
      
      // Only set loading to false if cache is relatively fresh (< 1 hour)
      if (isCacheFresh(timestamp)) {
        setInitialLoading(false);
      }
    }
    
    // Cleanup function to set mounted flag to false
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Memoized fetch function to prevent unnecessary rerenders
  const fetchEvents = useCallback(async (showToast = true) => {
    logEventFlow('useEventData', 'Fetching events...');
    
    // Set appropriate loading state based on current data state
    if (events.length > 0) {
      // We already have data, so we're just refreshing
      setIsRefreshing(true);
      
      // Make sure initialLoading is false in this case
      if (initialLoading) {
        setInitialLoading(false);
      }
    } else if (initialLoading) {
      // Keep initialLoading true if we're in initial load
      // No need to set it again
    } else {
      // Otherwise set operationLoading for other operations
      setOperationLoading(true);
    }
    
    setError(null);
    setOfflineMode(false);

    try {
      const { fetchedEvents, error: fetchError, offlineMode: isOffline } = await fetchEventData(showToast);
      
      // Only update state if component is still mounted
      if (!isMounted.current) return;
      
      if (fetchError) {
        setError(fetchError);
        setOfflineMode(isOffline);
        // Keep existing events if we have them
      } else if (fetchedEvents) {
        setEvents(fetchedEvents);
        setError(null);
        
        // Cache the events for offline use
        cacheEvents(fetchedEvents);
        setLastFetchTime(Date.now());
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted.current) {
        // Reset all loading states
        setInitialLoading(false);
        setOperationLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [events.length, initialLoading]);

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
        clearCachedEvents();
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
      isMounted.current = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
      if (refreshInterval) clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      logEventFlow('useEventData', "Hook cleanup");
    };
  }, [fetchEvents, lastFetchTime]);

  return {
    // Data
    events,
    setEvents,
    error,
    offlineMode,
    
    // Loading states - clearly named and separated
    loading: operationLoading, // Keep this for backward compatibility
    initialLoading,           // True only during first data load
    operationLoading,         // True during data operations that are not the initial load
    isRefreshing,             // True when refreshing existing data
    
    // Actions
    refetchEvents: fetchEvents,
    
    // Expose setOperationLoading for use by the EventContext
    setOperationLoading
  };
}
