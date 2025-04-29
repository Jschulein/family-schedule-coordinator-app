
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
        console.error("Error fetching family events:", familyEventError);
        return { events: [], error: "Failed to load family events: " + familyEventError.message };
      }
      
      // Get events created by the user or shared with their families
      let eventQuery = supabase.from('events').select('*').order('date', { ascending: true });
      
      if (familyEventRows && familyEventRows.length > 0) {
        // Get events that are either created by the user or shared with their families
        const eventIds = familyEventRows.map(row => row.event_id);
        
        const { data: eventRows, error: eventError } = await eventQuery.or(
          `id.in.(${eventIds.join(',')})${eventIds.length > 0 ? ',' : ''}creator_id.eq.${sessionData.session.user.id}`
        );

        if (eventError) {
          console.error("Error fetching events:", eventError);
          return { events: [], error: "Failed to load events: " + eventError.message };
        }

        // Process events with user profiles
        const mappedEvents = await processEventsWithProfiles(eventRows || []);
        return { events: mappedEvents, error: null };
      } else {
        // Just get user's personal events if no family events
        const { data: personalEvents, error: personalEventError } = await supabase
          .from('events')
          .select('*')
          .eq('creator_id', sessionData.session.user.id)
          .order('date', { ascending: true });
          
        if (personalEventError) {
          console.error("Error fetching personal events:", personalEventError);
          return { events: [], error: "Failed to load personal events: " + personalEventError.message };
        }
        
        // Process personal events
        const mappedEvents = await processEventsWithProfiles(personalEvents || []);
        return { events: mappedEvents, error: null };
      }
    } else {
      // No families found, just get personal events
      console.log("No families found for user, only returning personal events");
      
      const { data: personalEvents, error: personalEventError } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', sessionData.session.user.id)
        .order('date', { ascending: true });
        
      if (personalEventError) {
        console.error("Error fetching personal events:", personalEventError);
        return { events: [], error: "Failed to load personal events: " + personalEventError.message };
      }
      
      // Process personal events
      const mappedEvents = await processEventsWithProfiles(personalEvents || []);
      return { events: mappedEvents, error: null };
    }
  } catch (error: any) {
    console.error("Error in fetchEventsFromDb:", error);
    return { events: [], error: error.message || "An unexpected error occurred" };
  }
}

// Helper function to process events and fetch creator profiles
async function processEventsWithProfiles(eventRows: any[]) {
  if (!eventRows.length) return [];
  
  // Get unique creator IDs from the events
  const creatorIds = Array.from(
    new Set(eventRows.map((row: any) => row.creator_id))
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
  return eventRows.map((row: any) => fromDbEvent(row, userMap));
}
