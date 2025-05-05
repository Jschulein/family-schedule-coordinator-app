
import { supabase } from "@/integrations/supabase/client";
import { fromDbEvent } from "@/utils/eventFormatter";
import { UserProfile } from "@/types/eventTypes";
import { handleError } from "@/utils/errorHandler";

/**
 * Helper function to fetch personal events for a user
 * Optimized with proper error handling and query parameters
 */
export async function fetchUserPersonalEvents(userId: string) {
  try {
    console.log("Fetching personal events for user:", userId);
    
    const { data: personalEvents, error: personalEventError } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', userId)
      .order('date', { ascending: true });
      
    if (personalEventError) {
      return { 
        data: [], 
        error: handleError(personalEventError, { 
          context: "Fetching personal events",
          showToast: false
        })
      };
    }
    
    return { data: personalEvents || [], error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, { 
      context: "Fetching personal events",
      showToast: false
    });
    return { data: [], error: errorMessage };
  }
}

/**
 * Helper function to process events and fetch creator profiles
 * Optimized to fetch all profiles in a single query
 */
export async function processEventsWithProfiles(eventRows: any[]) {
  if (!eventRows.length) return [];
  
  // Get unique creator IDs from the events
  const creatorIds = Array.from(
    new Set(eventRows.map((row: any) => row.creator_id))
  ).filter(Boolean);
  
  let userMap: Record<string, UserProfile | undefined> = {};

  // Only fetch profiles if we have creator IDs
  if (creatorIds.length > 0) {
    try {
      console.log(`Fetching ${creatorIds.length} user profiles in a single query`);
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, Email')
        .in('id', creatorIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError.message);
      } else if (profiles) {
        // Create a lookup map of user profiles by ID for efficient access
        profiles.forEach((profile: UserProfile) => {
          userMap[profile.id] = profile;
        });
      }
    } catch (error: any) {
      console.error("Error processing profiles:", error.message);
    }
  }

  // Map the database rows to Event objects efficiently
  return eventRows.map((row: any) => fromDbEvent(row, userMap));
}
