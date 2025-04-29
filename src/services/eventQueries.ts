
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

    // First get user-accessible family IDs using security definer function
    const { data: userFamilies, error: familiesError } = await supabase
      .rpc('user_families');

    if (familiesError) {
      console.error("Error fetching user families:", familiesError);
      return { events: [], error: "Failed to load family information: " + familiesError.message };
    }

    // Construct the query based on family_id
    let eventQuery = supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    // If we have families, use them to filter events
    if (userFamilies && userFamilies.length > 0) {
      const familyIds = userFamilies.map(f => f.family_id);
      
      // Get events created by the user or linked to their families
      const { data: eventRows, error: eventError } = await eventQuery;

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
    } else {
      console.log("No families found for user, only returning personal events");
      
      // Just get events created by the current user
      const { data: eventRows, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', sessionData.session.user.id)
        .order('date', { ascending: true });

      if (eventError) {
        console.error("Error fetching personal events:", eventError);
        return { events: [], error: "Failed to load events: " + eventError.message };
      }

      // Process events as before
      const creatorIds = Array.from(
        new Set((eventRows || []).map((row: any) => row.creator_id))
      ).filter(Boolean);
      
      let userMap: Record<string, UserProfile | undefined> = {};

      if (creatorIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, Email')
          .in('id', creatorIds);

        if (profileError) {
          console.error("Error fetching profiles:", profileError);
        } else if (profiles) {
          profiles.forEach((profile: UserProfile) => {
            userMap[profile.id] = profile;
          });
        }
      }

      const mappedEvents = (eventRows || []).map((row: any) => fromDbEvent(row, userMap));
      
      if (mappedEvents.length === 0) {
        console.log("No personal events found in database");
      } else {
        console.log(`Successfully fetched ${mappedEvents.length} personal events`);
      }

      return { events: mappedEvents, error: null };
    }
  } catch (error: any) {
    console.error("Error in fetchEventsFromDb:", error);
    return { events: [], error: error.message || "An unexpected error occurred" };
  }
}
