
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { supabase } from "@/integrations/supabase/client";
import { processEventsWithProfiles } from "../helpers";
import { checkFunctionExists } from "@/services/database/functions";
import { handleEventError } from "@/utils/events";

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

    // Check if the function exists before calling it
    const functionName = 'get_user_events_safe';
    const backupFunctionName = 'get_user_accessible_events_safe';
    
    // First try to use the function name that exists in the database
    let useFunction = functionName;
    
    // Determine which function exists in the database
    const mainFunctionExists = await checkFunctionExists(functionName);
    if (!mainFunctionExists) {
      console.log(`Function ${functionName} not found, checking for ${backupFunctionName}`);
      const backupExists = await checkFunctionExists(backupFunctionName);
      
      if (backupExists) {
        console.log(`Using backup function ${backupFunctionName}`);
        useFunction = backupFunctionName;
      } else {
        console.error("Neither primary nor backup event access functions exist in the database");
        return { 
          events: [], 
          error: "Database configuration issue: Required function not found. Please contact support." 
        };
      }
    }

    // Call the appropriate function with type assertion for safety
    const { data, error } = await (supabase.rpc as any)(useFunction) as { 
      data: any[] | null; 
      error: any;
    };
    
    if (error) {
      console.error(`Error fetching events with function ${useFunction}:`, error);
      return { events: [], error: "Failed to load events: " + error.message };
    }
    
    // Check if data is an array and has items
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("No events found for user");
      return { events: [], error: null };
    }
    
    // Process and format the events
    const mappedEvents = await processEventsWithProfiles(data);
    console.log(`Successfully loaded ${mappedEvents.length} events`);
    
    return { events: mappedEvents, error: null };
  } catch (error: any) {
    const errorMessage = handleEventError(error, { 
      context: "Fetching events",
      showToast: false 
    });
    return { events: [], error: errorMessage };
  }
}
