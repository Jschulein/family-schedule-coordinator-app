
import { supabase } from "@/integrations/supabase/client";
import { fromDbEvent } from "@/utils/eventFormatter";
import { Event, UserProfile } from "@/types/eventTypes";
import { handleError } from "@/utils/errorHandler";
import { processEventsWithProfiles, fetchUserPersonalEvents } from "./helpers";

/**
 * Fetches events from the database that the current user has access to
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

    // First get user-accessible family IDs using security definer function
    const { data: userFamilies, error: familiesError } = await supabase
      .rpc('user_families');

    if (familiesError) {
      handleError(familiesError, { context: "Fetching user families" });
      return { events: [], error: "Failed to load family information: " + familiesError.message };
    }

    let eventRows: any[] = [];
    
    // If we have families, use them to filter events
    if (userFamilies && userFamilies.length > 0) {
      const familyIds = userFamilies.map(f => f.family_id);
      console.log(`Found ${familyIds.length} families for current user`);
      
      // Get events shared with these families
      const { data: familyEventRows, error: familyEventError } = await supabase
        .from('event_families')
        .select('event_id')
        .in('family_id', familyIds);
        
      if (familyEventError) {
        handleError(familyEventError, { context: "Fetching family events" });
        return { events: [], error: "Failed to load family events: " + familyEventError.message };
      }
      
      // If there are family events, get both personal and family events
      if (familyEventRows && familyEventRows.length > 0) {
        const eventIds = familyEventRows.map(row => row.event_id);
        
        const { data: combinedEvents, error: eventError } = await supabase
          .from('events')
          .select('*')
          .or(`id.in.(${eventIds.join(',')})${eventIds.length > 0 ? ',' : ''}creator_id.eq.${sessionData.session.user.id}`)
          .order('date', { ascending: true });

        if (eventError) {
          handleError(eventError, { context: "Fetching events" });
          return { events: [], error: "Failed to load events: " + eventError.message };
        }
        
        eventRows = combinedEvents || [];
      } else {
        // No family events, just get personal events
        const { data: personalEvents, error: personalEventError } = await fetchUserPersonalEvents(sessionData.session.user.id);
          
        if (personalEventError) {
          return { events: [], error: personalEventError };
        }
        
        eventRows = personalEvents || [];
      }
    } else {
      // No families found, just get personal events
      console.log("No families found for user, only returning personal events");
      
      const { data: personalEvents, error: personalEventError } = await fetchUserPersonalEvents(sessionData.session.user.id);
        
      if (personalEventError) {
        return { events: [], error: personalEventError };
      }
      
      eventRows = personalEvents || [];
    }
    
    // Process events with user profiles
    const mappedEvents = await processEventsWithProfiles(eventRows);
    return { events: mappedEvents, error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Fetching events",
      showToast: true 
    });
    return { events: [], error: errorMessage };
  }
}
