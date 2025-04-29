
import { supabase } from "@/integrations/supabase/client";
import { fromDbEvent } from "@/utils/eventFormatter";
import { UserProfile } from "@/types/eventTypes";
import { handleError } from "@/utils/errorHandler";

/**
 * Helper function to fetch personal events for a user
 */
export async function fetchUserPersonalEvents(userId: string) {
  const { data: personalEvents, error: personalEventError } = await supabase
    .from('events')
    .select('*')
    .eq('creator_id', userId)
    .order('date', { ascending: true });
    
  if (personalEventError) {
    handleError(personalEventError, { context: "Fetching personal events" });
    return { data: [], error: "Failed to load personal events: " + personalEventError.message };
  }
  
  return { data: personalEvents, error: null };
}

/**
 * Helper function to process events and fetch creator profiles
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
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, Email')
      .in('id', creatorIds);

    if (profileError) {
      handleError(profileError, { 
        context: "Fetching user profiles",
        showToast: false 
      });
    } else if (profiles) {
      // Create a lookup map of user profiles by ID
      profiles.forEach((profile: UserProfile) => {
        userMap[profile.id] = profile;
      });
    }
  }

  // Map the database rows to Event objects
  return eventRows.map((row: any) => fromDbEvent(row, userMap));
}
