
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Associates family members with an event
 */
export async function associateFamilyMembers(eventId: string, familyMemberIds: string[], userId: string) {
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
    toast({
      title: "Warning",
      description: "Event created but failed to associate with family members",
      variant: "destructive"
    });
  }
}

/**
 * Updates family member associations for an event
 */
export async function updateFamilyMemberAssociations(eventId: string, familyMemberIds: string[], userId: string) {
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
  } else {
    await associateFamilyMembers(eventId, familyMemberIds, userId);
  }
}

/**
 * Deletes family associations for an event
 */
export async function deleteFamilyAssociations(eventId: string) {
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
export async function deleteEvent(eventId: string) {
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  
  if (deleteError) {
    throw new Error(`Failed to delete event: ${deleteError.message}`);
  }
}
