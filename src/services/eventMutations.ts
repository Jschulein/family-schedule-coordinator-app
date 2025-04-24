
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { toast } from "@/components/ui/sonner";

export async function addEventToDb(newEvent: Event) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("You must be logged in to create events");
    }
    
    const eventData = {
      name: newEvent.name,
      date: newEvent.date.toISOString(),
      end_date: newEvent.end_date ? newEvent.end_date.toISOString() : newEvent.date.toISOString(),
      time: newEvent.time,
      description: newEvent.description || "",
      creator_id: session.user.id,
      all_day: newEvent.all_day || false
    };
    
    const { data: eventResult, error: eventError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();
    
    if (eventError) {
      throw new Error(`Failed to add event: ${eventError.message}`);
    }
    
    if (newEvent.familyMembers && newEvent.familyMembers.length > 0 && eventResult) {
      const familyMemberAssociations = newEvent.familyMembers.map(memberId => ({
        event_id: eventResult.id,
        family_id: memberId,
        shared_by: session.user.id
      }));
      
      const { error: associationError } = await supabase
        .from('event_families')
        .insert(familyMemberAssociations);
        
      if (associationError) {
        console.error("Error associating family members:", associationError);
        toast.warning("Event created but failed to associate with family members");
      }
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, Email')
      .eq('id', session.user.id)
      .single();

    const createdEvent: Event = {
      ...newEvent,
      id: eventResult?.id,
      creatorId: session.user.id,
      familyMember: profileData?.full_name || profileData?.Email || session.user.id.slice(0, 8) || "Unknown"
    };
    
    return { event: createdEvent, error: null };
  } catch (error: any) {
    console.error("Error adding event:", error);
    return { event: null, error: error.message || "Failed to add event: Unknown error" };
  }
}

export async function updateEventInDb(updatedEvent: Event) {
  try {
    if (!updatedEvent.id) {
      throw new Error("Event ID is required for updates");
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("You must be logged in to update events");
    }

    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('creator_id')
      .eq('id', updatedEvent.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to verify event ownership: ${fetchError.message}`);
    }

    if (existingEvent.creator_id !== session.user.id) {
      throw new Error("You can only edit events that you created");
    }

    const eventData = {
      name: updatedEvent.name,
      date: updatedEvent.date.toISOString(),
      end_date: updatedEvent.end_date ? updatedEvent.end_date.toISOString() : updatedEvent.date.toISOString(),
      time: updatedEvent.time,
      description: updatedEvent.description || "",
      all_day: updatedEvent.all_day || false
    };

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
      const { error: deleteError } = await supabase
        .from('event_families')
        .delete()
        .eq('event_id', updatedEvent.id);
        
      if (deleteError) {
        console.error("Error removing existing family associations:", deleteError);
        toast.warning("Event updated but failed to update family member associations");
      } else {
        const familyMemberAssociations = updatedEvent.familyMembers.map(memberId => ({
          event_id: updatedEvent.id,
          family_id: memberId,
          shared_by: session.user.id
        }));
        
        const { error: associationError } = await supabase
          .from('event_families')
          .insert(familyMemberAssociations);
          
        if (associationError) {
          console.error("Error associating family members:", associationError);
          toast.warning("Event updated but failed to update family member associations");
        }
      }
    }
    
    return { event: eventResult, error: null };
  } catch (error: any) {
    console.error("Error updating event:", error);
    return { event: null, error: error.message || "Failed to update event: Unknown error" };
  }
}

export async function deleteEventFromDb(eventId: string) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("You must be logged in to delete events");
    }

    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('creator_id, name')
      .eq('id', eventId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to verify event ownership: ${fetchError.message}`);
    }

    if (existingEvent.creator_id !== session.user.id) {
      throw new Error("You can only delete events that you created");
    }

    const { error: familyDeleteError } = await supabase
      .from('event_families')
      .delete()
      .eq('event_id', eventId);
      
    if (familyDeleteError) {
      console.error("Error removing family associations:", familyDeleteError);
    }

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);
    
    if (deleteError) {
      throw new Error(`Failed to delete event: ${deleteError.message}`);
    }
    
    return { 
      success: true, 
      message: `Event "${existingEvent.name}" deleted successfully`, 
      error: null 
    };
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return { 
      success: false, 
      message: null, 
      error: error.message || "Failed to delete event: Unknown error" 
    };
  }
}
