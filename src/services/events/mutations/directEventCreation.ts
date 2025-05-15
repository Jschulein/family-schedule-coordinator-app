
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { toast } from "@/components/ui/use-toast";
import { logEventFlow } from "@/utils/events";

/**
 * A direct, simplified event creation function with minimal complexity
 * Focuses only on creating the event and associating it with family members
 * Returns a structured response object with consistent error handling
 */
export async function createEvent(eventData: Event): Promise<{ 
  success: boolean; 
  eventId?: string; 
  error?: string;
  details?: any;
}> {
  try {
    logEventFlow("directEventCreation", "Starting direct event creation", { name: eventData.name });
    
    // 1. Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logEventFlow("directEventCreation", "Authentication error", sessionError);
      return { 
        success: false, 
        error: `Authentication error: ${sessionError.message}`,
        details: sessionError
      };
    }
    
    if (!session) {
      logEventFlow("directEventCreation", "No active session found");
      return { success: false, error: "You must be logged in to create events" };
    }
    
    // 2. Prepare event data
    const dbEvent = {
      name: eventData.name,
      date: eventData.date instanceof Date ? eventData.date.toISOString() : eventData.date,
      end_date: eventData.end_date instanceof Date ? eventData.end_date.toISOString() : eventData.end_date || eventData.date,
      time: eventData.time || "12:00",
      description: eventData.description || "",
      creator_id: session.user.id,
      all_day: eventData.all_day || false
    };
    
    logEventFlow("directEventCreation", "Inserting event", dbEvent);
    
    // 3. Create the event - direct database operation
    const { data: createdEvent, error: insertError } = await supabase
      .from("events")
      .insert(dbEvent)
      .select("*")
      .single();
    
    if (insertError) {
      logEventFlow("directEventCreation", "Error creating event", insertError);
      return { 
        success: false, 
        error: `Failed to create event: ${insertError.message}`,
        details: insertError
      };
    }
    
    if (!createdEvent) {
      logEventFlow("directEventCreation", "No event data returned after creation");
      return { success: false, error: "No event data returned after creation" };
    }
    
    logEventFlow("directEventCreation", "Event created successfully", { id: createdEvent.id });
    
    // 4. Associate with family members if needed
    if (eventData.familyMembers && eventData.familyMembers.length > 0) {
      logEventFlow("directEventCreation", "Associating with family members", { 
        count: eventData.familyMembers.length 
      });

      // First, get family information for these members
      const { data: familyMembers, error: membersError } = await supabase
        .from("family_members")
        .select("id, family_id")
        .in("id", eventData.familyMembers);
      
      if (membersError) {
        logEventFlow("directEventCreation", "Error fetching family members", membersError);
        // Note: We don't fail the whole operation here, just log it
        toast({
          title: "Warning",
          description: "Event created, but there was an issue associating family members",
          variant: "default"
        });
        
        // Return partial success
        return { 
          success: true, 
          eventId: createdEvent.id,
          error: "Event created, but family member association failed"
        };
      } 
      else if (familyMembers && familyMembers.length > 0) {
        // Create a unique set of family IDs
        const familyIds = [...new Set(familyMembers.map(m => m.family_id).filter(Boolean))];
        
        if (familyIds.length > 0) {
          logEventFlow("directEventCreation", "Associating with families", { familyIds });
          
          // Create family associations
          const familyAssociations = familyIds.map(familyId => ({
            event_id: createdEvent.id,
            family_id: familyId,
            shared_by: session.user.id
          }));
          
          const { error: associationError } = await supabase
            .from("event_families")
            .insert(familyAssociations);
          
          if (associationError) {
            logEventFlow("directEventCreation", "Error associating families", associationError);
            toast({
              title: "Warning",
              description: "Event created, but there was an issue with family associations",
              variant: "default"
            });
            
            // Return partial success
            return { 
              success: true, 
              eventId: createdEvent.id,
              error: "Event created, but family association failed"
            };
          }
        }
      }
    }
    
    return { success: true, eventId: createdEvent.id };
    
  } catch (error: any) {
    logEventFlow("directEventCreation", "Unexpected error", error);
    return { 
      success: false, 
      error: error?.message || "An unexpected error occurred while creating the event",
      details: error
    };
  }
}
