
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/types/eventTypes";
import { handleError } from "@/utils/error";
import { prepareEventData } from "../helpers/eventData";
import { fetchCreatorProfile, getCreatorDisplayName } from "../helpers/creatorProfile";
import { associateFamilyMembers } from "../helpers/familyAssociations";

/**
 * Adds a new event to the database
 * @param newEvent The event data to add
 * @returns The created event or error information
 */
export async function addEventToDb(newEvent: Event) {
  try {
    console.log("Starting event creation process:", newEvent.name);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error("You must be logged in to create events");
    }
    
    // Prepare the event data for database insertion
    const eventData = prepareEventData(newEvent, session.user.id);
    console.log("Prepared event data:", eventData);
    
    // Insert the event into the database
    const { data: eventResult, error: eventError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();
    
    if (eventError) {
      console.error("Database error when creating event:", eventError);
      throw new Error(`Failed to add event: ${eventError.message}`);
    }
    
    if (!eventResult) {
      throw new Error("No data returned when creating event");
    }
    
    console.log("Event created successfully:", eventResult.id);
    
    // Associate family members if specified
    if (newEvent.familyMembers && newEvent.familyMembers.length > 0) {
      console.log("Associating family members:", newEvent.familyMembers);
      try {
        await associateFamilyMembers(eventResult.id, newEvent.familyMembers, session.user.id);
        console.log("Family members associated successfully");
      } catch (associationError) {
        console.error("Error associating family members:", associationError);
        // We don't throw here because the event was created successfully
        // But we'll include it in the event object for the UI to handle
      }
    } else {
      console.log("No family members to associate");
    }

    // Fetch the creator's profile information
    let creatorProfile;
    try {
      creatorProfile = await fetchCreatorProfile(session.user.id);
      console.log("Fetched creator profile:", creatorProfile);
    } catch (profileError) {
      console.error("Error fetching creator profile:", profileError);
      // Don't throw, we can still return the event without the creator's display name
    }

    // Construct the final event object
    const createdEvent: Event = {
      ...newEvent,
      id: eventResult?.id,
      creatorId: session.user.id,
      familyMember: creatorProfile ? getCreatorDisplayName(creatorProfile, session.user.id) : session.user.id
    };
    
    console.log("Returning created event:", createdEvent);
    return { event: createdEvent, error: null };
  } catch (error: any) {
    console.error("Error in addEventToDb:", error);
    const errorMessage = handleError(error, { 
      context: "Adding event",
      showToast: false // We'll let the calling function handle the toast
    });
    return { event: null, error: errorMessage };
  }
}
