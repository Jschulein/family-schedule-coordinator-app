
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Associates family members with an event
 * Returns a promise to allow proper await/error handling
 */
export async function associateFamilyMembers(eventId: string, familyMemberIds: string[], userId: string) {
  if (!eventId) {
    console.error("Cannot associate family members: No event ID provided");
    return Promise.reject(new Error("Missing event ID"));
  }
  
  if (!familyMemberIds || familyMemberIds.length === 0) {
    console.log("No family members to associate with event", eventId);
    return Promise.resolve(); // No members to add is valid
  }
  
  try {
    const familyMemberAssociations = familyMemberIds.map(memberId => ({
      event_id: eventId,
      family_id: memberId, // This is actually the family member ID
      shared_by: userId
    }));
    
    const { error: associationError } = await supabase
      .from('event_families')
      .insert(familyMemberAssociations);
      
    if (associationError) {
      console.error("Error associating family members:", associationError);
      toast({
        title: "Warning",
        description: "Event created but failed to associate with family members",
        variant: "destructive"
      });
      return Promise.reject(associationError);
    }
    
    console.log(`Successfully associated event ${eventId} with ${familyMemberIds.length} family members`);
    return Promise.resolve();
  } catch (error) {
    console.error("Unexpected error in associateFamilyMembers:", error);
    return Promise.reject(error);
  }
}

/**
 * Updates family member associations for an event
 */
export async function updateFamilyMemberAssociations(eventId: string, familyMemberIds: string[], userId: string) {
  try {
    const { error: deleteError } = await supabase
      .from('event_families')
      .delete()
      .eq('event_id', eventId);
      
    if (deleteError) {
      console.error("Error removing existing family associations:", deleteError);
      toast({
        title: "Warning", 
        description: "Event updated but failed to update family member associations",
        variant: "destructive"
      });
      return Promise.reject(deleteError);
    } 
    
    if (familyMemberIds.length > 0) {
      return associateFamilyMembers(eventId, familyMemberIds, userId);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error in updateFamilyMemberAssociations:", error);
    return Promise.reject(error);
  }
}

/**
 * Deletes family associations for an event
 */
export async function deleteFamilyAssociations(eventId: string) {
  try {
    const { error: familyDeleteError } = await supabase
      .from('event_families')
      .delete()
      .eq('event_id', eventId);
      
    if (familyDeleteError) {
      console.error("Error removing family associations:", familyDeleteError);
      return Promise.reject(familyDeleteError);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error in deleteFamilyAssociations:", error);
    return Promise.reject(error);
  }
}

/**
 * Deletes an event
 */
export async function deleteEvent(eventId: string) {
  try {
    // First remove family associations
    await deleteFamilyAssociations(eventId);
    
    // Then delete the event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (deleteError) {
      throw new Error(`Failed to delete event: ${deleteError.message}`);
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error in deleteEvent:", error);
    return Promise.reject(error);
  }
}
