
import { supabase } from "@/integrations/supabase/client";
import { fromDbEvent } from "@/utils/eventFormatter";
import { Event, UserProfile } from "@/types/eventTypes";

export async function fetchEventsFromDb() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Authentication error:", sessionError.message);
      return { events: [], error: "Authentication error: " + sessionError.message };
    }
    
    if (!sessionData.session) {
      console.log("No active session found");
      return { events: [], error: "You must be logged in to view events" };
    }

    // Simplify the query - we're now relying on the RLS policies
    const { data: eventRows, error: eventError } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (eventError) {
      console.error("Error fetching events:", eventError);
      return { events: [], error: "Failed to load events: " + eventError.message };
    }

    // Get unique creator IDs from the events
    const creatorIds = Array.from(
      new Set((eventRows || []).map((row: any) => row.creator_id))
    ).filter(Boolean);
    
    let userMap: Record<string, UserProfile | undefined> = {};

    // Only fetch profiles if we have creator IDs
    if (creatorIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, Email')
        .in('id', creatorIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
      } else if (profiles) {
        // Create a lookup map of user profiles by ID
        profiles.forEach((profile: UserProfile) => {
          userMap[profile.id] = profile;
        });
      }
    }

    // Map the database rows to Event objects
    const mappedEvents = (eventRows || []).map((row: any) => fromDbEvent(row, userMap));
    
    if (mappedEvents.length === 0) {
      console.log("No events found in database");
    } else {
      console.log(`Successfully fetched ${mappedEvents.length} events`);
    }

    return { events: mappedEvents, error: null };
  } catch (error: any) {
    console.error("Error in fetchEventsFromDb:", error);
    return { events: [], error: error.message || "An unexpected error occurred" };
  }
}
