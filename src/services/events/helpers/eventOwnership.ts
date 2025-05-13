
import { supabase } from "@/integrations/supabase/client";
import { callFunction } from "@/services/database/functions";

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

  // Call the direct ownership check first for better performance
  const { data: existingEvent, error: fetchError } = await supabase
    .from('events')
    .select('creator_id, name')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to verify event ownership: ${fetchError.message}`);
  }

  // Check if the user can access this event using our security definer function
  const { data: canAccess, error: accessError } = await callFunction<boolean>(
    "user_can_access_event_safe", 
    { event_id_param: eventId }
  );

  if (accessError) {
    throw new Error(`Failed to verify event access: ${accessError.message}`);
  }

  if (!canAccess) {
    throw new Error("You do not have permission to access this event");
  }

  return { 
    session, 
    ownedByUser: existingEvent.creator_id === session.user.id,
    eventName: existingEvent.name
  };
}
