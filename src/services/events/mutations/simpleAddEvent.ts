
/**
 * Simplified event creation function
 * Focused on direct database interaction with minimal complexity
 * Used for testing and debugging the event creation process
 */
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";

/**
 * Add an event to the database with minimal processing
 * Designed for testing and debugging the core database functionality
 */
export async function simpleAddEvent(eventData: Event) {
  console.log("Starting simplified event creation:", eventData);
  
  try {
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("No active session. User must be logged in");
    }
    
    console.log("Auth verified, user ID:", session.user.id);
    
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
    
    console.log("Prepared event data for DB:", dbEvent);
    
    // Insert the event directly
    const { data: createdEvent, error: insertError } = await supabase
      .from('events')
      .insert(dbEvent)
      .select()
      .single();
    
    if (insertError) {
      console.error("Database error creating event:", insertError);
      throw new Error(`Failed to create event: ${insertError.message}`);
    }
    
    if (!createdEvent) {
      throw new Error("No event data returned after successful creation");
    }
    
    console.log("Created event:", createdEvent);
    
    // If family members specified, associate them
    if (eventData.familyMembers && eventData.familyMembers.length > 0) {
      console.log(`Associating event with ${eventData.familyMembers.length} family members`);
      
      try {
        // First, get family members data to extract the correct family IDs
        const { data: familyMembers, error: familyMembersError } = await supabase
          .from('family_members')
          .select('id, family_id')
          .in('id', eventData.familyMembers);
        
        if (familyMembersError) {
          console.error("Error fetching family members:", familyMembersError);
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
        
        // Create associations for each unique family
        const familyAssociations = Array.from(familyMap.keys()).map(familyId => ({
          event_id: createdEvent.id,
          family_id: familyId,
          shared_by: session.user.id
        }));
        
        if (familyAssociations.length > 0) {
          const { error: associationError } = await supabase
            .from('event_families')
            .insert(familyAssociations);
            
          if (associationError) {
            console.error("Error associating event with families:", associationError);
            return { 
              event: createdEvent, 
              error: `Event created but family association failed: ${associationError.message}`
            };
          }
          
          console.log("Successfully associated event with families");
        }
      } catch (associationError: any) {
        console.error("Unexpected error in family associations:", associationError);
        return { 
          event: createdEvent, 
          error: `Event created but had association error: ${associationError.message}`
        };
      }
    }
    
    // Return the created event
    return { event: createdEvent, error: null };
    
  } catch (error: any) {
    console.error("Error in simpleAddEvent:", error);
    const errorMessage = handleError(error, { 
      context: "Simple event creation", 
      showToast: false
    });
    return { event: null, error: errorMessage };
  }
}
