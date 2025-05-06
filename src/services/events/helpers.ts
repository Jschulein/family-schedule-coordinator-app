import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { toast } from "@/components/ui/use-toast";

/**
 * Prepares event data for database operations
 */
export function prepareEventData(event: Event, userId: string) {
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
export async function verifyEventOwnership(eventId: string) {
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

/**
 * Fetches profile information for the event creator
 */
export async function fetchCreatorProfile(userId: string) {
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
export function getCreatorDisplayName(profile: any, userId: string) {
  return profile?.full_name || profile?.Email || userId.slice(0, 8) || "Unknown";
}

/**
 * Creates a helper function to check if a database function exists
 */
export async function functionExists(functionName: string): Promise<boolean> {
  try {
    // We need to check in a way that doesn't cause permission issues
    // Use a custom SQL query that checks for the function's existence
    const { data, error } = await supabase.rpc('function_exists', { 
      function_name: functionName 
    });
      
    if (error) {
      console.error(`Error checking if function ${functionName} exists:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Error checking for function ${functionName}:`, error);
    return false;
  }
}
