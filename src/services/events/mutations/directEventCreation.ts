
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { toast } from "@/components/ui/use-toast";
import { logEventFlow } from "@/utils/events";
import { withValidSession } from "@/services/auth/authUtils";

/**
 * A direct, simplified event creation function with minimal complexity
 * Uses security definer function to bypass RLS timing issues
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
    
    // Use withValidSession helper to ensure we have a valid session
    return withValidSession(async (session) => {
      // Verify that the user profile exists in the profiles table
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        logEventFlow("directEventCreation", "Error checking user profile", profileError);
        return { 
          success: false, 
          error: `Failed to verify user profile: ${profileError.message}`,
          details: profileError 
        };
      }

      if (!userProfile) {
        logEventFlow("directEventCreation", "User profile not found, attempting to create one");
        // If profile doesn't exist, try to create it
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata.full_name || session.user.email,
            Email: session.user.email
          });
          
        if (createProfileError) {
          logEventFlow("directEventCreation", "Failed to create user profile", createProfileError);
          return { 
            success: false, 
            error: `Failed to create user profile: ${createProfileError.message}`,
            details: createProfileError
          };
        }
        
        logEventFlow("directEventCreation", "Created user profile successfully");
      }
      
      // Prepare the event data for our function call
      const functionParams = {
        p_name: eventData.name,
        p_date: eventData.date instanceof Date ? eventData.date.toISOString() : eventData.date,
        p_end_date: eventData.end_date instanceof Date ? eventData.end_date.toISOString() : eventData.end_date || eventData.date,
        p_time: eventData.time || "12:00",
        p_description: eventData.description || "",
        p_creator_id: session.user.id,
        p_all_day: eventData.all_day || false,
        p_family_members: eventData.familyMembers || null
      };
      
      logEventFlow("directEventCreation", "Calling secure event creation function", {
        params: functionParams,
        userId: session.user.id
      });
      
      // Call our security definer function that bypasses RLS
      const { data: eventId, error: functionError } = await supabase
        .rpc('create_event_securely', functionParams);
      
      if (functionError) {
        logEventFlow("directEventCreation", "Error from secure event creation function", functionError);
        return { 
          success: false, 
          error: `Failed to create event: ${functionError.message}`,
          details: functionError
        };
      }
      
      if (!eventId) {
        logEventFlow("directEventCreation", "No event ID returned from function");
        return { success: false, error: "No event ID returned after creation" };
      }
      
      logEventFlow("directEventCreation", "Event created successfully", { id: eventId });
      
      // Success!
      return { success: true, eventId: eventId };
    });
  } catch (error: any) {
    logEventFlow("directEventCreation", "Unexpected error", error);
    return { 
      success: false, 
      error: error?.message || "An unexpected error occurred while creating the event",
      details: error
    };
  }
}
