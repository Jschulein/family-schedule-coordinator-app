
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/errorHandler";
import { prepareEventData, verifyEventOwnership, updateFamilyMemberAssociations } from "../helpers";

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
