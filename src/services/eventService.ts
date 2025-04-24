
import { supabase } from "@/integrations/supabase/client";
import { Event, UserProfile } from "@/types/eventTypes";
import { toast } from "@/components/ui/sonner";

/**
 * Formats a database event to the application event model with user profile data
 */
export function fromDbEvent(row: any, userMap: Record<string, UserProfile | undefined>): Event {
  const userProfile = userMap[row.creator_id];
  const familyMember =
    userProfile?.full_name ||
    userProfile?.Email ||
    row.creator_id?.slice(0, 8) || 
    "Unknown";
  
  return {
    id: row.id,
    name: row.name,
    date: new Date(row.date),
    end_date: row.end_date ? new Date(row.end_date) : undefined,
    time: row.time,
    description: row.description ?? "",
    familyMember,
    creatorId: row.creator_id,
    all_day: row.all_day || false
  };
}

/**
 * Fetches all events from the database
 */
export async function fetchEventsFromDb() {
  try {
    // Get the current session to verify authentication
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
        // Continue with what we have - don't block event display due to profile errors
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

/**
 * Adds a new event to the database
 */
export async function addEventToDb(newEvent: Event) {
  try {
    // Verify user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("You must be logged in to create events");
    }
    
    // Format dates for Supabase
    const eventData = {
      name: newEvent.name,
      date: newEvent.date.toISOString(),
      end_date: newEvent.end_date ? newEvent.end_date.toISOString() : newEvent.date.toISOString(),
      time: newEvent.time,
      description: newEvent.description || "",
      creator_id: session.user.id,
      all_day: newEvent.all_day || false
    };
    
    console.log("Event data for insert:", eventData);
    
    const { data: eventResult, error: eventError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();
    
    if (eventError) {
      console.error("Error adding event:", eventError);
      throw new Error(`Failed to add event: ${eventError.message}`);
    }
    
    console.log("Event created successfully:", eventResult);
    
    if (newEvent.familyMembers && newEvent.familyMembers.length > 0 && eventResult) {
      const familyMemberAssociations = newEvent.familyMembers.map(memberId => ({
        event_id: eventResult.id,
        family_id: memberId,
        shared_by: session.user.id
      }));
      
      console.log("Associating with family members:", familyMemberAssociations);
      
      const { error: associationError } = await supabase
        .from('event_families')
        .insert(familyMemberAssociations);
        
      if (associationError) {
        console.error("Error associating family members:", associationError);
        toast.warning("Event created but failed to associate with family members");
      }
    }

    // Get the user profile for display
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, Email')
      .eq('id', session.user.id)
      .single();

    // Create a complete event object with the returned data for the UI
    const createdEvent: Event = {
      ...newEvent,
      id: eventResult?.id,
      creatorId: session.user.id,
      familyMember: profileData?.full_name || profileData?.Email || session.user.id.slice(0, 8) || "Unknown"
    };
    
    return { event: createdEvent, error: null };
  } catch (error: any) {
    console.error("Error adding event:", error);
    return { event: null, error: error.message || "Failed to add event: Unknown error" };
  }
}
