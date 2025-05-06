
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/error";
import { verifyEventOwnership } from "../helpers/eventOwnership";
import { deleteFamilyAssociations, deleteEvent as deleteEventHelper } from "../helpers/familyAssociations";

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
    await deleteEventHelper(eventId);
    
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
