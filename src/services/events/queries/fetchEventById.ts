import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { fromDbEvent } from "@/utils/events";
import { handleError } from "@/utils/error";

/**
 * Fetches a single event by ID from the database
 * Optimized to reduce the number of database calls by fetching family members and creator profile in parallel
 * 
 * @param eventId The ID of the event to fetch
 * @returns The event data and any error
 */
export async function fetchEventById(eventId: string): Promise<{ event: Event | null, error: string | null }> {
  try {
    console.log("Fetching event by ID:", eventId);
    
    if (!eventId) {
      console.error("Invalid event ID: empty or undefined");
      return { event: null, error: "Invalid event ID provided" };
    }
    
    // Fetch the event and associated family members in parallel for better performance
    const [eventResult, familyResult] = await Promise.all([
      // Fetch event details
      supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle(),
        
      // Fetch family associations
      supabase
        .from('event_families')
        .select('family_id')
        .eq('event_id', eventId)
    ]);
    
    const { data: eventData, error: eventError } = eventResult;
    const { data: familyData, error: familyError } = familyResult;
      
    if (eventError) {
      console.error("Error fetching event:", eventError);
      throw new Error(`Failed to fetch event: ${eventError.message}`);
    }
    
    if (!eventData) {
      console.log(`Event with ID ${eventId} not found`);
      return { event: null, error: "Event not found" };
    }
    
    if (familyError) {
      console.error("Error fetching event family members:", familyError);
      // Continue with the event data without family members
    }
    
    const familyMembers = familyData?.map(item => item.family_id) || [];
    
    // Fetch creator profile - we only need to do this if the event exists
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', eventData.creator_id)
      .maybeSingle();

    // Create a user map for the fromDbEvent function
    const userMap = {
      [eventData.creator_id]: userProfile || undefined
    };
    
    // Format the event with family members included
    const formattedEvent = fromDbEvent({
      ...eventData,
      familyMembers
    }, userMap);
    
    return { event: formattedEvent, error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching event by ID",
      showToast: true,
      logDetails: true
    });
    return { event: null, error: errorMessage };
  }
}

/**
 * Optimized wrapper for fetchEventById that includes caching
 * For use in components that need to fetch the same event multiple times
 * 
 * @param eventId The ID of the event to fetch
 * @returns The event data and loading/error states
 */
let eventCache: Record<string, { event: Event | null, timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds

export async function fetchEventWithCache(eventId: string): Promise<{ 
  event: Event | null, 
  error: string | null,
  fromCache: boolean 
}> {
  const now = Date.now();
  const cached = eventCache[eventId];
  
  // Return cached result if valid and not expired
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return { 
      event: cached.event, 
      error: null, 
      fromCache: true 
    };
  }
  
  // Fetch fresh data
  const result = await fetchEventById(eventId);
  
  // Update cache if successful
  if (result.event) {
    eventCache[eventId] = {
      event: result.event,
      timestamp: now
    };
  }
  
  return { 
    ...result, 
    fromCache: false 
  };
}
