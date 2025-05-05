
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { processEventsWithProfiles, fetchUserPersonalEvents } from "./helpers";

/**
 * Fetches events from the database that the current user has access to
 * Optimized to reduce database calls and improve error handling
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
    
    // First get user-accessible family IDs using security definer function
    const { data: userFamilies, error: familiesError } = await supabase
      .rpc('user_families');

    if (familiesError) {
      handleError(familiesError, { context: "Fetching user families" });
      return { events: [], error: "Failed to load family information: " + familiesError.message };
    }

    let eventRows: any[] = [];
    
    // Determine the most efficient query based on family membership
    if (userFamilies && userFamilies.length > 0) {
      const familyIds = userFamilies.map(f => f.family_id);
      console.log(`User belongs to ${familyIds.length} families, fetching family events`);
      
      // Get events shared with these families
      const { data: familyEventRows, error: familyEventError } = await supabase
        .from('event_families')
        .select('event_id')
        .in('family_id', familyIds);
        
      if (familyEventError) {
        handleError(familyEventError, { context: "Fetching family events" });
        return { events: [], error: "Failed to load family events: " + familyEventError.message };
      }
      
      if (familyEventRows && familyEventRows.length > 0) {
        const eventIds = familyEventRows.map(row => row.event_id);
        console.log(`Found ${eventIds.length} family events, fetching combined events`);
        
        // Use a more efficient query with proper OR condition
        const eventFilter = `id.in.(${eventIds.join(',')})`;
        const creatorFilter = `creator_id.eq.${userId}`;
        const filterCondition = eventIds.length > 0 
          ? `${eventFilter},${creatorFilter}` 
          : creatorFilter;
          
        const { data: combinedEvents, error: eventError } = await supabase
          .from('events')
          .select('*')
          .or(filterCondition)
          .order('date', { ascending: true });

        if (eventError) {
          handleError(eventError, { context: "Fetching events" });
          return { events: [], error: "Failed to load events: " + eventError.message };
        }
        
        eventRows = combinedEvents || [];
        console.log(`Retrieved ${eventRows.length} combined events`);
      } else {
        // No family events, just get personal events
        console.log("No family events found, getting personal events only");
        const { data: personalEvents, error: personalEventError } = await fetchUserPersonalEvents(userId);
          
        if (personalEventError) {
          return { events: [], error: personalEventError };
        }
        
        eventRows = personalEvents || [];
      }
    } else {
      // No families found, just get personal events
      console.log("No families found for user, only returning personal events");
      
      const { data: personalEvents, error: personalEventError } = await fetchUserPersonalEvents(userId);
        
      if (personalEventError) {
        return { events: [], error: personalEventError };
      }
      
      eventRows = personalEvents || [];
    }
    
    // Process events with user profiles
    const mappedEvents = await processEventsWithProfiles(eventRows);
    console.log(`Returning ${mappedEvents.length} processed events to client`);
    return { events: mappedEvents, error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Fetching events",
      showToast: true 
    });
    return { events: [], error: errorMessage };
  }
}
