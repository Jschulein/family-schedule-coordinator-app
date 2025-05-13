
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { processEventsWithProfiles, fetchUserPersonalEvents } from "./helpers";
import { functionExists } from "../helpers";
import { callFunction } from "@/services/database/functions";

/**
 * Maximum retry attempts for fetching events
 */
const MAX_RETRIES = 2;

/**
 * Fetches events from the database that the current user has access to
 * Using the security definer function to avoid RLS recursion issues
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
      
      // Primary approach: Use the security definer function
      try {
        // Check if our RPC exists before trying to use it
        const fnExists = await functionExists("get_user_events_safe");
          
        if (fnExists) {
          // Call the function using the callFunction helper to avoid type errors
          const { data, error } = await callFunction<any[]>("get_user_events_safe");
            
          if (error) {
            console.error("Error calling get_user_events_safe function:", error);
            // Continue to fallback if function call fails
          } else if (data && data.length > 0) {
            // Successfully got events, process and return
            console.log(`Successfully fetched ${data.length} events using security definer function`);
            const mappedEvents = await processEventsWithProfiles(data);
            return { events: mappedEvents, error: null };
          }
        }
        
        // If direct method failed or function doesn't exist, fall back to personal events
        if (retries >= MAX_RETRIES) {
          console.log("Falling back to personal events after security definer function failed");
          return await fetchPersonalEventsOnly(userId);
        }
        
        // Increment retry counter and try again
        retries++;
        return await fetchWithRetry();
        
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
