
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/error";
import { fetchPersonalEventsOnly } from './fetchPersonalEvents';

/**
 * Attempts to fetch both family-shared events and personal events
 */
export async function fetchCombinedEvents(userId: string, familyIds: string[]) {
  try {
    // Use a transaction to make this more reliable
    console.log(`Fetching events for ${familyIds.length} families`);
    
    // First try to get event_families entries to find shared events
    const { data: familyEventRows, error: familyEventError } = await supabase
      .from('event_families')
      .select('event_id')
      .in('family_id', familyIds);
      
    if (familyEventError) {
      console.error("Error fetching family events:", familyEventError);
      // Fall back to just personal events if family events fail
      return await fetchPersonalEventsOnly(userId);
    }
    
    let eventIds: string[] = [];
    if (familyEventRows && familyEventRows.length > 0) {
      eventIds = familyEventRows.map(row => row.event_id);
      console.log(`Found ${eventIds.length} shared event IDs`);
    } else {
      console.log("No shared events found");
    }
    
    // Try to get all events (both personal and from families)
    let events: any[] = [];
    
    // First try to get personal events
    const { data: personalEvents, error: personalError } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', userId);
      
    if (personalError) {
      console.error("Error fetching personal events:", personalError);
    } else {
      events = personalEvents || [];
      console.log(`Found ${events.length} personal events`);
    }
    
    // If we have family-shared event IDs, fetch those too
    if (eventIds.length > 0) {
      const { data: sharedEvents, error: sharedError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .not('creator_id', 'eq', userId); // Don't double-count user's own events
        
      if (sharedError) {
        console.error("Error fetching shared events:", sharedError);
      } else if (sharedEvents) {
        // Combine shared events with personal events
        events = [...events, ...sharedEvents];
        console.log(`Added ${sharedEvents.length} shared events, total: ${events.length}`);
      }
    }
    
    // Process all events with profiles
    const { processEventsWithProfiles } = await import('../helpers');
    const mappedEvents = await processEventsWithProfiles(events);
    console.log(`Returning ${mappedEvents.length} combined events`);
    return { events: mappedEvents, error: null };
  } catch (error) {
    handleError(error, { context: "Fetching combined events" });
    return { events: [], error: "Failed to load events" };
  }
}
