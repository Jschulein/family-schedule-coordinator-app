
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { fromDbEvent } from "@/utils/eventFormatter";
import { handleError } from "@/utils/errorHandler";

/**
 * Fetches a single event by ID from the database
 * Optimized to reduce the number of database calls
 * @param eventId The ID of the event to fetch
 * @returns The event data and any error
 */
export async function fetchEventById(eventId: string): Promise<{ event: Event | null, error: string | null }> {
  try {
    console.log("Fetching event by ID:", eventId);
    
    // Fetch the event and associated family members in parallel
    const [eventResult, familyResult] = await Promise.all([
      // Fetch event details
      supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle(),
        
      // Fetch family associations
      supabase
        .from('event_families')
        .select('family_id')
        .eq('event_id', eventId)
    ]);
    
    const { data: eventData, error: eventError } = eventResult;
    const { data: familyData, error: familyError } = familyResult;
      
    if (eventError) {
      console.error("Error fetching event:", eventError);
      throw new Error(`Failed to fetch event: ${eventError.message}`);
    }
    
    if (!eventData) {
      return { event: null, error: "Event not found" };
    }
    
    if (familyError) {
      console.error("Error fetching event family members:", familyError);
      // We'll continue with the event data without family members
    }
    
    const familyMembers = familyData?.map(item => item.family_id) || [];
    
    // Fetch creator profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', eventData.creator_id)
      .maybeSingle();

    // Create a user map for the fromDbEvent function
    const userMap = {
      [eventData.creator_id]: userProfile || undefined
    };
    
    // Format the event with family members included
    const formattedEvent = fromDbEvent({
      ...eventData,
      familyMembers
    }, userMap);
    
    return { event: formattedEvent, error: null };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching event by ID",
      showToast: true
    });
    return { event: null, error: errorMessage };
  }
}
