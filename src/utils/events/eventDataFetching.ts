
import { Event } from '@/types/eventTypes';
import { fetchEventsFromDb } from '@/services/events';
import { toast } from "@/components/ui/use-toast";
import { logEventFlow } from '@/utils/events';

/**
 * Handles event data fetching logic and error handling
 * Extracted from useEventData hook for better code organization
 */
export const fetchEventData = async (showToast = true): Promise<{
  fetchedEvents: Event[] | null;
  error: string | null;
  offlineMode: boolean;
}> => {
  logEventFlow('eventDataFetching', 'Fetching events...');
  
  try {
    // Using our simplified approach with security definer function
    const { events: fetchedEvents, error: fetchError } = await fetchEventsFromDb();
    
    if (fetchError) {
      logEventFlow('eventDataFetching', 'Failed to fetch events', fetchError);
      
      if (showToast) {
        toast({ 
          title: "Error", 
          description: "Unable to fetch events. Using available local data.", 
          variant: "destructive" 
        });
      }
      
      return {
        fetchedEvents: null,
        error: fetchError,
        offlineMode: true
      };
    } 
    
    if (fetchedEvents) {
      logEventFlow('eventDataFetching', `Successfully loaded ${fetchedEvents.length} events`);
      
      return {
        fetchedEvents,
        error: null,
        offlineMode: false
      };
    }
    
    return {
      fetchedEvents: null,
      error: "No events returned",
      offlineMode: true
    };
  } catch (e: any) {
    logEventFlow('eventDataFetching', 'Error in fetchEvents', e);
    
    if (showToast) {
      toast({ 
        title: "Error", 
        description: "Failed to load events. Using local data.", 
        variant: "destructive" 
      });
    }
    
    return {
      fetchedEvents: null,
      error: "An unexpected error occurred",
      offlineMode: true
    };
  }
};

/**
 * Handles caching events to localStorage
 */
export const cacheEvents = (events: Event[]): void => {
  try {
    localStorage.setItem('cachedEvents', JSON.stringify(events));
    localStorage.setItem('cachedEventsTimestamp', Date.now().toString());
    logEventFlow('eventDataFetching', `Cached ${events.length} events to localStorage`);
  } catch (e) {
    logEventFlow('eventDataFetching', 'Failed to cache events', e);
  }
};

/**
 * Loads cached events from localStorage
 */
export const loadCachedEvents = (): {
  events: Event[] | null;
  timestamp: number | null;
} => {
  const cachedEventsJson = localStorage.getItem('cachedEvents');
  const cachedTimestamp = localStorage.getItem('cachedEventsTimestamp');
  
  if (cachedEventsJson) {
    try {
      const parsedEvents = JSON.parse(cachedEventsJson);
      const timestamp = cachedTimestamp ? Number(cachedTimestamp) : null;
      
      logEventFlow('eventDataFetching', `Loaded ${parsedEvents.length} events from cache`);
      
      return {
        events: parsedEvents,
        timestamp
      };
    } catch (e) {
      logEventFlow('eventDataFetching', 'Failed to parse cached events', e);
    }
  }
  
  return {
    events: null,
    timestamp: null
  };
};

/**
 * Determines if cached data is fresh enough to use (less than 1 hour old)
 */
export const isCacheFresh = (timestamp: number | null): boolean => {
  if (!timestamp) return false;
  return (Date.now() - timestamp < 3600000); // 1 hour
};

/**
 * Clears cached events from localStorage
 */
export const clearCachedEvents = (): void => {
  localStorage.removeItem('cachedEvents');
  localStorage.removeItem('cachedEventsTimestamp');
  logEventFlow('eventDataFetching', 'Cleared cached events from localStorage');
};
