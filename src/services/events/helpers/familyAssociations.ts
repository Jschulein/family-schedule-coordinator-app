
import { supabase } from "@/integrations/supabase/client";

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
    console.log("Starting family member association for event:", eventId, "with members:", familyMemberIds);
    
    // First, get family members data to extract the correct family IDs
    const { data: familyMembers, error: familyMembersError } = await supabase
      .from('family_members')
      .select('id, family_id, user_id')
      .in('id', familyMemberIds);
    
    if (familyMembersError) {
      console.error("Error fetching family members data:", familyMembersError);
      return Promise.reject(new Error(`Failed to retrieve family information: ${familyMembersError.message}`));
    }
    
    if (!familyMembers || familyMembers.length === 0) {
      console.warn("No family members found with the provided IDs:", familyMemberIds);
      return Promise.resolve(); // No valid members found
    }
    
    console.log("Retrieved family members data:", familyMembers);
    
    // Create associations using the family IDs (not member IDs) to properly link events with families
    const familyAssociations = familyMembers.map(member => ({
      event_id: eventId,
      family_id: member.family_id, // Use family_id, not member.id
      shared_by: userId
    }));
    
    console.log("Creating family event associations:", familyAssociations);
    
    const { error: associationError } = await supabase
      .from('event_families')
      .insert(familyAssociations);
      
    if (associationError) {
      console.error("Error associating event with families:", associationError);
      return Promise.reject(new Error(`Failed to associate event with families: ${associationError.message}`));
    }
    
    console.log(`Successfully associated event ${eventId} with ${familyMembers.length} families`);
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
    console.log("Updating family associations for event:", eventId);
    
    // First delete all existing associations
    const { error: deleteError } = await supabase
      .from('event_families')
      .delete()
      .eq('event_id', eventId);
      
    if (deleteError) {
      console.error("Error removing existing family associations:", deleteError);
      return Promise.reject(new Error(`Failed to update family associations: ${deleteError.message}`));
    } 
    
    // If we have new family members to associate, do that
    if (familyMemberIds && familyMemberIds.length > 0) {
      return associateFamilyMembers(eventId, familyMemberIds, userId);
    }
    
    return Promise.resolve();
  } catch (error: any) {
    console.error("Error in updateFamilyMemberAssociations:", error);
    return Promise.reject(error);
  }
}

/**
 * Deletes family associations for an event
 */
export async function deleteFamilyAssociations(eventId: string) {
  try {
    console.log("Deleting family associations for event:", eventId);
    
    const { error: familyDeleteError } = await supabase
      .from('event_families')
      .delete()
      .eq('event_id', eventId);
      
    if (familyDeleteError) {
      console.error("Error removing family associations:", familyDeleteError);
      return Promise.reject(new Error(`Failed to remove family associations: ${familyDeleteError.message}`));
    }
    
    return Promise.resolve();
  } catch (error: any) {
    console.error("Error in deleteFamilyAssociations:", error);
    return Promise.reject(error);
  }
}

/**
 * Deletes an event
 */
export async function deleteEvent(eventId: string) {
  try {
    console.log("Completely deleting event:", eventId);
    
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
  } catch (error: any) {
    console.error("Error in deleteEvent:", error);
    return Promise.reject(error);
  }
}
