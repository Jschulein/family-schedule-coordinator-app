
import { supabase } from "@/integrations/supabase/client";

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
