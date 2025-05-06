
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { processEventsWithProfiles, fetchUserPersonalEvents } from "./helpers";

/**
 * Fetches events from the database that the current user has access to
 * Uses a more resilient approach that avoids infinite recursion
 */
export async function fetchEventsFromDb() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      handleError(sessionError, { context: "Authentication check" });
      return { events: [], error: "Authentication error: " + sessionError.message };
    }
    
    if (!sessionData.session) {
      console.log("No active session found");
      return { events: [], error: "You must be logged in to view events" };
    }

    const userId = sessionData.session.user.id;
    console.log(`Fetching events for user: ${userId}`);
    
    try {
      // Use the direct security definer function to get family IDs
      // This avoids the recursive RLS policy issue
      const { data: userFamilies, error: familiesError } = await supabase
        .rpc('user_families');
  
      if (familiesError) {
        console.error("Error fetching user families:", familiesError);
        // If we hit an error with user_families, fall back to just personal events
        return await fetchPersonalEventsOnly(userId);
      }
      
      // If user has no families, just fetch personal events
      if (!userFamilies || userFamilies.length === 0) {
        console.log("No families found for user, returning personal events only");
        return await fetchPersonalEventsOnly(userId);
      }
      
      // User has families, attempt to fetch combined events
      const familyIds = userFamilies.map(f => f.family_id);
      return await fetchCombinedEvents(userId, familyIds);
      
    } catch (error) {
      console.error("Error in family events fetch:", error);
      // If anything fails in the family fetching process, fall back to personal events
      return await fetchPersonalEventsOnly(userId);
    }
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Fetching events",
      showToast: true 
    });
    return { events: [], error: errorMessage };
  }
}

/**
 * Fetches only personal events for a user
 * Used as a fallback when family events can't be fetched
 */
async function fetchPersonalEventsOnly(userId: string) {
  console.log("Falling back to personal events only");
  
  try {
    const { data: personalEvents, error: personalEventError } = await fetchUserPersonalEvents(userId);
      
    if (personalEventError) {
      return { events: [], error: personalEventError };
    }
    
    // Process events with user profiles
    const mappedEvents = await processEventsWithProfiles(personalEvents || []);
    console.log(`Returning ${mappedEvents.length} personal events`);
    return { events: mappedEvents, error: null };
  } catch (error) {
    handleError(error, { context: "Fetching personal events fallback" });
    return { events: [], error: "Failed to load events" };
  }
}

/**
 * Attempts to fetch both family-shared events and personal events
 */
async function fetchCombinedEvents(userId: string, familyIds: string[]) {
  try {
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
      }
    }
    
    // Process all events with profiles
    const mappedEvents = await processEventsWithProfiles(events);
    console.log(`Returning ${mappedEvents.length} combined events`);
    return { events: mappedEvents, error: null };
  } catch (error) {
    handleError(error, { context: "Fetching combined events" });
    return { events: [], error: "Failed to load events" };
  }
}
