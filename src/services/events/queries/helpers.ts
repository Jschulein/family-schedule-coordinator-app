
import { supabase } from "@/integrations/supabase/client";
import { fromDbEvent } from "@/utils/events";
import { UserProfile, Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";

/**
 * Helper function to fetch personal events for a user
 * Optimized with proper error handling and query parameters
 * 
 * @param userId The ID of the user to fetch events for
 * @returns An object containing the events data and any error
 */
export async function fetchUserPersonalEvents(userId: string) {
  try {
    if (!userId) {
      return { 
        data: [], 
        error: "User ID is required" 
      };
    }
    
    console.log("Fetching personal events for user:", userId);
    
    const { data: personalEvents, error: personalEventError } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', userId)
      .order('date', { ascending: true });
      
    if (personalEventError) {
      return { 
        data: [], 
        error: handleError(personalEventError, { 
          context: "Fetching personal events",
          showToast: false,
          logDetails: true
        })
      };
    }
    
    return { data: personalEvents || [], error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Fetching personal events",
      showToast: false,
      logDetails: true
    });
    return { data: [], error: errorMessage };
  }
}

/**
 * Helper function to process events and fetch creator profiles
 * Optimized to fetch all profiles in a single query
 * 
 * @param eventRows The raw event rows from the database
 * @returns An array of formatted Event objects
 */
export async function processEventsWithProfiles(eventRows: any[]): Promise<Event[]> {
  if (!eventRows.length) return [];
  
  // Get unique creator IDs from the events
  const creatorIds = Array.from(
    new Set(eventRows.map((row: any) => row.creator_id))
  ).filter(Boolean);
  
  let userMap: Record<string, UserProfile | undefined> = {};

  // Only fetch profiles if we have creator IDs
  if (creatorIds.length > 0) {
    try {
      console.log(`Fetching ${creatorIds.length} user profiles in a single query`);
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, Email')
        .in('id', creatorIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError.message);
      } else if (profiles) {
        // Create a lookup map of user profiles by ID for efficient access
        profiles.forEach((profile: UserProfile) => {
          userMap[profile.id] = profile;
        });
        console.log(`Successfully fetched ${profiles.length} profiles`);
      }
    } catch (error: any) {
      console.error("Error processing profiles:", error.message);
    }
  }

  // Map the database rows to Event objects efficiently
  return eventRows.map((row: any) => {
    try {
      return fromDbEvent(row, userMap);
    } catch (error) {
      console.error("Error formatting event:", error, "for row:", row);
      // Return a minimal valid event to prevent the entire list from failing
      return {
        id: row.id || "unknown-id",
        name: "Error: Malformed Event",
        date: new Date(),
        time: "00:00",
        description: "This event could not be properly loaded.",
        creatorId: row.creator_id || "unknown",
        familyMember: "Unknown",
        familyMembers: [], // Required field
        all_day: false // Required field
      };
    }
  });
}

/**
 * Fetches events filtered by date range
 * Useful for calendar views and date-based filtering
 * 
 * @param startDate The start date to filter from (inclusive)
 * @param endDate The end date to filter to (inclusive)
 * @returns An array of events within the date range and any error
 */
export async function fetchEventsByDateRange(
  startDate: Date, 
  endDate: Date
): Promise<{ events: Event[], error: string | null }> {
  try {
    // Format dates for Postgres
    const formattedStartDate = startDate.toISOString();
    const formattedEndDate = endDate.toISOString();
    
    console.log(`Fetching events from ${formattedStartDate} to ${formattedEndDate}`);
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', formattedStartDate)
      .lte('date', formattedEndDate)
      .order('date', { ascending: true });
      
    if (error) {
      return { 
        events: [], 
        error: handleError(error, { 
          context: "Fetching events by date range",
          showToast: false 
        }) 
      };
    }
    
    if (!data || data.length === 0) {
      return { events: [], error: null };
    }
    
    // Process the events to include user profiles
    const formattedEvents = await processEventsWithProfiles(data);
    
    return { events: formattedEvents, error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Fetching events by date range",
      showToast: false 
    });
    return { events: [], error: errorMessage };
  }
}
