
/**
 * Simplified event creation function
 * Focused on direct database interaction with minimal complexity
 * Used for testing and debugging the event creation process
 */
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { logEventFlow } from "@/utils/events";

/**
 * Add an event to the database with minimal processing
 * Designed for testing and debugging the core database functionality
 */
export async function simpleAddEvent(eventData: Event) {
  logEventFlow('simpleAddEvent', 'Starting simplified event creation', { 
    name: eventData.name,
    date: eventData.date
  });
  
  try {
    // Verify authentication
    logEventFlow('simpleAddEvent', 'Verifying authentication');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logEventFlow('simpleAddEvent', 'Authentication error', sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      logEventFlow('simpleAddEvent', 'No active session found');
      throw new Error("No active session. User must be logged in");
    }
    
    logEventFlow('simpleAddEvent', 'Auth verified, preparing database format', { userId: session.user.id });
    
    // Prepare database format
    const dbEvent = {
      name: eventData.name || "Untitled Event",
      date: eventData.date instanceof Date ? eventData.date.toISOString() : new Date().toISOString(),
      end_date: eventData.end_date instanceof Date ? eventData.end_date.toISOString() : undefined,
      time: eventData.time || "12:00",
      description: eventData.description || "",
      creator_id: session.user.id,
      all_day: eventData.all_day || false
    };
    
    logEventFlow('simpleAddEvent', 'Inserting event into database');
    
    // Insert the event directly
    const { data: createdEvent, error: insertError } = await supabase
      .from('events')
      .insert(dbEvent)
      .select()
      .single();
    
    if (insertError) {
      logEventFlow('simpleAddEvent', 'Database error creating event', insertError);
      throw new Error(`Failed to create event: ${insertError.message}`);
    }
    
    if (!createdEvent) {
      logEventFlow('simpleAddEvent', 'No event data returned after successful creation');
      throw new Error("No event data returned after successful creation");
    }
    
    logEventFlow('simpleAddEvent', 'Event created successfully', { id: createdEvent.id });
    
    // If family members specified, associate them
    if (eventData.familyMembers && eventData.familyMembers.length > 0) {
      logEventFlow('simpleAddEvent', `Associating event with ${eventData.familyMembers.length} family members`);
      
      try {
        // First, get family members data to extract the correct family IDs
        const { data: familyMembers, error: familyMembersError } = await supabase
          .from('family_members')
          .select('id, family_id')
          .in('id', eventData.familyMembers);
        
        if (familyMembersError) {
          logEventFlow('simpleAddEvent', 'Error fetching family members', familyMembersError);
          return { 
            event: createdEvent, 
            error: `Event created but family association failed: ${familyMembersError.message}`
          };
        }
        
        // Group by family_id to avoid duplicate family associations
        const familyMap = new Map();
        familyMembers?.forEach(member => {
          if (member?.family_id) {
            familyMap.set(member.family_id, true);
          }
        });
        
        logEventFlow('simpleAddEvent', `Found ${familyMap.size} unique families to associate`);
        
        // Create associations for each unique family
        const familyAssociations = Array.from(familyMap.keys()).map(familyId => ({
          event_id: createdEvent.id,
          family_id: familyId,
          shared_by: session.user.id
        }));
        
        if (familyAssociations.length > 0) {
          logEventFlow('simpleAddEvent', 'Creating family associations', familyAssociations);
          
          const { error: associationError } = await supabase
            .from('event_families')
            .insert(familyAssociations);
            
          if (associationError) {
            logEventFlow('simpleAddEvent', 'Error associating event with families', associationError);
            return { 
              event: createdEvent, 
              error: `Event created but family association failed: ${associationError.message}`
            };
          }
          
          logEventFlow('simpleAddEvent', 'Successfully associated event with families');
        }
      } catch (associationError: any) {
        logEventFlow('simpleAddEvent', 'Unexpected error in family associations', associationError);
        return { 
          event: createdEvent, 
          error: `Event created but had association error: ${associationError.message}`
        };
      }
    }
    
    // Return the created event
    logEventFlow('simpleAddEvent', 'Event creation completed successfully');
    return { event: createdEvent, error: null };
    
  } catch (error: any) {
    logEventFlow('simpleAddEvent', 'Error in simpleAddEvent', error);
    const errorMessage = handleError(error, { 
      context: "Simple event creation", 
      showToast: false
    });
    return { event: null, error: errorMessage };
  }
}
