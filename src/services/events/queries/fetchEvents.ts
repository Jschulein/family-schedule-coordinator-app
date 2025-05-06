
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { processEventsWithProfiles, fetchUserPersonalEvents } from "./helpers";
import { functionExists } from "../helpers";

/**
 * Maximum retry attempts for fetching events
 */
const MAX_RETRIES = 2;

/**
 * Fetches events from the database that the current user has access to
 * Uses a more resilient approach with multiple fallback mechanisms
 */
export async function fetchEventsFromDb() {
  let retries = 0;
  
  // Helper for retry logic
  const fetchWithRetry = async (): Promise<{ events: Event[], error: string | null }> => {
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
      console.log(`Fetching events for user: ${userId}, attempt ${retries + 1}`);
      
      try {
        // Use the most direct and efficient method first
        // Check if our RPC exists before trying to use it
        const fnExists = await functionExists("get_user_events_safe");
          
        if (fnExists) {
          // Call the function directly if it exists using a direct fetch to avoid type errors
          try {
            const response = await fetch(
              `https://yuraqejlapinpglrkkux.supabase.co/rest/v1/rpc/get_user_events_safe`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabase.supabaseKey,
                  'Authorization': `Bearer ${supabase.supabaseKey}`
                }
              }
            );
            
            if (!response.ok) {
              throw new Error(`RPC call failed: ${response.statusText}`);
            }
            
            const directEvents = await response.json();
            
            // If this function exists and returns data successfully, use it
            if (Array.isArray(directEvents) && directEvents.length > 0) {
              console.log(`Successfully fetched ${directEvents.length} events using direct RPC`);
              const mappedEvents = await processEventsWithProfiles(directEvents);
              return { events: mappedEvents, error: null };
            }
          } catch (rpcError) {
            console.error("Error calling get_user_events_safe RPC:", rpcError);
            // Continue to fallback approaches
          }
        }
        
        // If direct method failed or doesn't exist, and we've used all retries, 
        // fall back to personal events
        if (retries >= MAX_RETRIES) {
          console.log("Falling back to personal events after direct RPC failed or doesn't exist");
          return await fetchPersonalEventsOnly(userId);
        }
        
        // Otherwise, try the fallback approach to get all user families first
        // and then fetch events for each family
        const { data: userFamilies, error: familiesError } = await supabase
          .rpc('get_user_families');
      
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
        const familyIds = userFamilies.map(f => f.id);
        return await fetchCombinedEvents(userId, familyIds);
        
      } catch (error) {
        console.error("Error in event fetching process:", error);
        if (retries < MAX_RETRIES) {
          retries++;
          console.log(`Retrying event fetch (${retries}/${MAX_RETRIES})...`);
          return await fetchWithRetry();
        } else {
          // If anything fails after all retries, fall back to personal events
          console.log("All retries failed, falling back to personal events");
          return await fetchPersonalEventsOnly(userId);
        }
      }
    } catch (error: any) {
      const errorMessage = handleError(error, { 
        context: "Fetching events",
        showToast: false 
      });
      return { events: [], error: errorMessage };
    }
  };
  
  return await fetchWithRetry();
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
    const mappedEvents = await processEventsWithProfiles(events);
    console.log(`Returning ${mappedEvents.length} combined events`);
    return { events: mappedEvents, error: null };
  } catch (error) {
    handleError(error, { context: "Fetching combined events" });
    return { events: [], error: "Failed to load events" };
  }
}
