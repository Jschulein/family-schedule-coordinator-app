
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { toast } from "@/components/ui/use-toast";
import { handleError } from "@/utils/errorHandler";

/**
 * Adds a new event to the database
 * @param newEvent The event data to add
 * @returns The created event or error information
 */
export async function addEventToDb(newEvent: Event) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("You must be logged in to create events");
    }
    
    const eventData = prepareEventData(newEvent, session.user.id);
    
    const { data: eventResult, error: eventError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();
    
    if (eventError) {
      throw new Error(`Failed to add event: ${eventError.message}`);
    }
    
    if (!eventResult) {
      throw new Error("No data returned when creating event");
    }
    
    if (newEvent.familyMembers && newEvent.familyMembers.length > 0) {
      await associateFamilyMembers(eventResult.id, newEvent.familyMembers, session.user.id);
    }

    const creatorProfile = await fetchCreatorProfile(session.user.id);

    const createdEvent: Event = {
      ...newEvent,
      id: eventResult?.id,
      creatorId: session.user.id,
      familyMember: getCreatorDisplayName(creatorProfile, session.user.id)
    };
    
    return { event: createdEvent, error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Adding event",
      showToast: true 
    });
    return { event: null, error: errorMessage };
  }
}

/**
 * Updates an existing event in the database
 * @param updatedEvent The updated event data
 * @returns Result of the update operation
 */
export async function updateEventInDb(updatedEvent: Event) {
  try {
    if (!updatedEvent.id) {
      throw new Error("Event ID is required for updates");
    }

    const { session, ownedByUser } = await verifyEventOwnership(updatedEvent.id);
    if (!ownedByUser) {
      throw new Error("You can only edit events that you created");
    }

    const eventData = prepareEventData(updatedEvent, session.user.id);

    const { data: eventResult, error: updateError } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', updatedEvent.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update event: ${updateError.message}`);
    }
    
    if (updatedEvent.familyMembers && updatedEvent.familyMembers.length > 0) {
      await updateFamilyMemberAssociations(updatedEvent.id, updatedEvent.familyMembers, session.user.id);
    }
    
    return { event: eventResult, error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Updating event",
      showToast: true 
    });
    return { event: null, error: errorMessage };
  }
}

/**
 * Deletes an event from the database
 * @param eventId The ID of the event to delete
 * @returns Result of the deletion operation
 */
export async function deleteEventFromDb(eventId: string) {
  try {
    const { session, ownedByUser, eventName } = await verifyEventOwnership(eventId);
    if (!ownedByUser) {
      throw new Error("You can only delete events that you created");
    }

    await deleteFamilyAssociations(eventId);
    await deleteEvent(eventId);
    
    return { 
      success: true, 
      message: `Event "${eventName}" deleted successfully`, 
      error: null 
    };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Deleting event",
      showToast: true 
    });
    return { 
      success: false, 
      message: null, 
      error: errorMessage
    };
  }
}

// Helper functions

/**
 * Prepares event data for database operations
 */
function prepareEventData(event: Event, userId: string) {
  return {
    name: event.name,
    date: event.date.toISOString(),
    end_date: event.end_date ? event.end_date.toISOString() : event.date.toISOString(),
    time: event.time,
    description: event.description || "",
    creator_id: userId,
    all_day: event.all_day || false
  };
}

/**
 * Verifies that the current user owns the event
 */
async function verifyEventOwnership(eventId: string) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Authentication error: ${sessionError.message}`);
  }
  
  if (!session) {
    throw new Error("You must be logged in to manage events");
  }

  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('creator_id, name')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to verify event ownership: ${fetchError.message}`);
  }

  return { 
    session, 
    ownedByUser: existingEvent.creator_id === session.user.id,
    eventName: existingEvent.name
  };
}

/**
 * Associates family members with an event
 */
async function associateFamilyMembers(eventId: string, familyMemberIds: string[], userId: string) {
  const familyMemberAssociations = familyMemberIds.map(memberId => ({
    event_id: eventId,
    family_id: memberId,
    shared_by: userId
  }));
  
  const { error: associationError } = await supabase
    .from('event_families')
    .insert(familyMemberAssociations);
    
  if (associationError) {
    console.error("Error associating family members:", associationError);
    toast.warning("Event created but failed to associate with family members");
  }
}

/**
 * Updates family member associations for an event
 */
async function updateFamilyMemberAssociations(eventId: string, familyMemberIds: string[], userId: string) {
  const { error: deleteError } = await supabase
    .from('event_families')
    .delete()
    .eq('event_id', eventId);
    
  if (deleteError) {
    console.error("Error removing existing family associations:", deleteError);
    toast.warning("Event updated but failed to update family member associations");
  } else {
    await associateFamilyMembers(eventId, familyMemberIds, userId);
  }
}

/**
 * Deletes family associations for an event
 */
async function deleteFamilyAssociations(eventId: string) {
  const { error: familyDeleteError } = await supabase
    .from('event_families')
    .delete()
    .eq('event_id', eventId);
    
  if (familyDeleteError) {
    console.error("Error removing family associations:", familyDeleteError);
  }
}

/**
 * Deletes an event
 */
async function deleteEvent(eventId: string) {
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  
  if (deleteError) {
    throw new Error(`Failed to delete event: ${deleteError.message}`);
  }
}

/**
 * Fetches profile information for the event creator
 */
async function fetchCreatorProfile(userId: string) {
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, Email')
    .eq('id', userId)
    .single();
  
  return profileData;
}

/**
 * Gets display name for the event creator
 */
function getCreatorDisplayName(profile: any, userId: string) {
  return profile?.full_name || profile?.Email || userId.slice(0, 8) || "Unknown";
}
