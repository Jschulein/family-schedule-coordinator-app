
import { handleError } from "@/utils/error";

/**
 * Fetches only personal events for a user
 * Used as a fallback when family events can't be fetched
 */
export async function fetchPersonalEventsOnly(userId: string) {
  console.log("Falling back to personal events only");
  
  try {
    const { fetchUserPersonalEvents, processEventsWithProfiles } = await import('../helpers');
    const { data: personalEvents, error: personalEventError } = await fetchUserPersonalEvents(userId);
      
    if (personalEventError) {
      return { events: [], error: personalEventError };
    }
    
    // Process events with user profiles
    const mappedEvents = await processEventsWithProfiles(personalEvents || []);
    console.log(`Returning ${mappedEvents.length} personal events`);
    return { events: mappedEvents, error: null };
  } catch (error) {
    handleError(error, { context: "Fetching personal events fallback" });
    return { events: [], error: "Failed to load events" };
  }
}
