
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { prepareEventData } from "../helpers/eventData";
import { fetchCreatorProfile, getCreatorDisplayName } from "../helpers/creatorProfile";
import { associateFamilyMembers } from "../helpers/familyAssociations";

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
