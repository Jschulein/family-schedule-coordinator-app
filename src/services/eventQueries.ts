
import { supabase } from "@/integrations/supabase/client";
import { fromDbEvent } from "@/utils/eventFormatter";
import { Event, UserProfile } from "@/types/eventTypes";

export async function fetchEventsFromDb() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!sessionData.session) {
      console.log("No active session found");
      return { events: [], error: "You must be logged in to view events" };
    }

    const { data: eventRows, error: eventError } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (eventError) {
      console.error("Error fetching events:", eventError);
      throw new Error(`Failed to load events: ${eventError.message}`);
    }

    const creatorIds = Array.from(new Set((eventRows || []).map((row: any) => row.creator_id))).filter(Boolean);
    let userMap: Record<string, UserProfile | undefined> = {};

    if (creatorIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, Email')
        .in('id', creatorIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
      }

      if (profiles) {
        profiles.forEach((profile: UserProfile) => {
          userMap[profile.id] = profile;
        });
      }
    }

    const mappedEvents = (eventRows || []).map((row: any) => fromDbEvent(row, userMap));
    
    if (mappedEvents.length === 0) {
      console.log("No events found in database");
    }

    return { events: mappedEvents, error: null };
  } catch (error: any) {
    console.error("Error in fetchEventsFromDb:", error);
    return { events: [], error: error.message || "An unexpected error occurred" };
  }
}
