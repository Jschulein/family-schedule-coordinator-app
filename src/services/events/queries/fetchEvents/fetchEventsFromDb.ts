import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { supabase } from "@/integrations/supabase/client";
import { functionExists } from "../../helpers/databaseUtils";
import { fetchPersonalEventsOnly } from './fetchPersonalEvents';
import { fetchCombinedEvents } from './fetchFamilyEvents';

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
                  'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cmFxZWpsYXBpbnBnbHJra3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNzQ5NTMsImV4cCI6MjA2MDg1MDk1M30.PyS67UKFVi5iriwjDmeJWLrHBOyN4cL-IRBdpLYdpZ4',
                  'Authorization': `Bearer ${sessionData.session?.access_token}`
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
              const { processEventsWithProfiles } = await import('../helpers');
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
