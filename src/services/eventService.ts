
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

/**
 * Updates an existing event in the database
 */
export async function updateEventInDb(updatedEvent: Event) {
  try {
    if (!updatedEvent.id) {
      throw new Error("Event ID is required for updates");
    }

    // Verify user is authenticated and authorized to update this event
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("You must be logged in to update events");
    }

    // Check if user is the creator of this event
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('creator_id')
      .eq('id', updatedEvent.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to verify event ownership: ${fetchError.message}`);
    }

    if (existingEvent.creator_id !== session.user.id) {
      throw new Error("You can only edit events that you created");
    }

    // Format dates for Supabase
    const eventData = {
      name: updatedEvent.name,
      date: updatedEvent.date.toISOString(),
      end_date: updatedEvent.end_date ? updatedEvent.end_date.toISOString() : updatedEvent.date.toISOString(),
      time: updatedEvent.time,
      description: updatedEvent.description || "",
      all_day: updatedEvent.all_day || false
    };

    console.log("Event data for update:", eventData);

    const { data: eventResult, error: updateError } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', updatedEvent.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating event:", updateError);
      throw new Error(`Failed to update event: ${updateError.message}`);
    }
    
    console.log("Event updated successfully:", eventResult);
    
    if (updatedEvent.familyMembers && updatedEvent.familyMembers.length > 0) {
      // First delete existing associations
      const { error: deleteError } = await supabase
        .from('event_families')
        .delete()
        .eq('event_id', updatedEvent.id);
        
      if (deleteError) {
        console.error("Error removing existing family associations:", deleteError);
        toast.warning("Event updated but failed to update family member associations");
      } else {
        // Then add new associations
        const familyMemberAssociations = updatedEvent.familyMembers.map(memberId => ({
          event_id: updatedEvent.id,
          family_id: memberId,
          shared_by: session.user.id
        }));
        
        const { error: associationError } = await supabase
          .from('event_families')
          .insert(familyMemberAssociations);
          
        if (associationError) {
          console.error("Error associating family members:", associationError);
          toast.warning("Event updated but failed to update family member associations");
        }
      }
    }
    
    return { event: eventResult, error: null };
  } catch (error: any) {
    console.error("Error updating event:", error);
    return { event: null, error: error.message || "Failed to update event: Unknown error" };
  }
}

/**
 * Deletes an event from the database
 */
export async function deleteEventFromDb(eventId: string) {
  try {
    // Verify user is authenticated and authorized to delete this event
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("You must be logged in to delete events");
    }

    // Check if user is the creator of this event
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('creator_id, name')
      .eq('id', eventId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to verify event ownership: ${fetchError.message}`);
    }

    if (existingEvent.creator_id !== session.user.id) {
      throw new Error("You can only delete events that you created");
    }

    // Delete associated family members first
    const { error: familyDeleteError } = await supabase
      .from('event_families')
      .delete()
      .eq('event_id', eventId);
      
    if (familyDeleteError) {
      console.error("Error removing family associations:", familyDeleteError);
      // Continue with event deletion anyway
    }

    // Delete the event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (deleteError) {
      console.error("Error deleting event:", deleteError);
      throw new Error(`Failed to delete event: ${deleteError.message}`);
    }
    
    console.log("Event deleted successfully:", existingEvent.name);
    
    return { 
      success: true, 
      message: `Event "${existingEvent.name}" deleted successfully`, 
      error: null 
    };
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return { 
      success: false, 
      message: null, 
      error: error.message || "Failed to delete event: Unknown error" 
    };
  }
}
