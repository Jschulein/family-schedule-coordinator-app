
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { supabase } from "@/integrations/supabase/client";
import { processEventsWithProfiles } from "../helpers";

/**
 * Fetches events from the database that the current user has access to
 * Uses the security definer function to bypass RLS recursion issues
 */
export async function fetchEventsFromDb() {
  console.log("Fetching events using optimized security definer function");
  
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

    // Use our improved security definer function to avoid recursion
    const { data, error } = await supabase.rpc('get_user_accessible_events_safe');
    
    if (error) {
      console.error("Error fetching events with security definer function:", error);
      return { events: [], error: "Failed to load events: " + error.message };
    }
    
    if (!data || data.length === 0) {
      console.log("No events found for user");
      return { events: [], error: null };
    }
    
    // Process and format the events
    const mappedEvents = await processEventsWithProfiles(data);
    console.log(`Successfully loaded ${mappedEvents.length} events`);
    
    return { events: mappedEvents, error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Fetching events",
      showToast: false 
    });
    return { events: [], error: errorMessage };
  }
}
