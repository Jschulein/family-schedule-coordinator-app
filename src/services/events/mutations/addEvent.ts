
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
  const eventName = newEvent.name || "unnamed event";
  console.log(`Starting event creation process for "${eventName}"`);
  
  try {
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error(`Authentication error during event creation for "${eventName}":`, sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error(`No session found for event creation "${eventName}"`);
      throw new Error("You must be logged in to create events");
    }
    
    // Prepare the event data for database insertion
    const eventData = prepareEventData(newEvent, session.user.id);
    console.log(`Prepared event data for "${eventName}":`, eventData);
    
    // Insert the event into the database
    console.log(`Inserting event "${eventName}" into database...`);
    const { data: eventResult, error: eventError } = await supabase
      .from('events')
      .insert([eventData])
      .select('*')
      .single();
    
    if (eventError) {
      console.error(`Database error when creating event "${eventName}":`, eventError);
      throw new Error(`Failed to add event: ${eventError.message}`);
    }
    
    if (!eventResult) {
      console.error(`No data returned when creating event "${eventName}"`);
      throw new Error("No data returned when creating event");
    }
    
    console.log(`Event "${eventName}" created successfully with ID: ${eventResult.id}`);
    
    // Fetch the creator's profile information
    let creatorProfile;
    try {
      console.log(`Fetching creator profile for event "${eventName}"...`);
      creatorProfile = await fetchCreatorProfile(session.user.id);
      console.log(`Fetched creator profile for event "${eventName}":`, creatorProfile);
    } catch (profileError) {
      console.warn(`Error fetching creator profile for event "${eventName}":`, profileError);
      // Continue without throwing, as we can still return the event without profile data
    }
    
    // Associate family members if specified
    let familyMemberError = null;
    if (newEvent.familyMembers && newEvent.familyMembers.length > 0) {
      console.log(`Associating ${newEvent.familyMembers.length} family members with event "${eventName}" (ID: ${eventResult.id})...`);
      try {
        await associateFamilyMembers(eventResult.id, newEvent.familyMembers, session.user.id);
        console.log(`Family members successfully associated with event "${eventName}"`);
      } catch (associationError: any) {
        console.error(`Error associating family members with event "${eventName}":`, associationError);
        familyMemberError = associationError.message;
        // Continue without throwing, as the event was created successfully
      }
    } else {
      console.log(`No family members to associate with event "${eventName}"`);
    }

    // Construct the final event object - Map database fields to frontend fields
    const createdEvent: Event = {
      id: eventResult.id,
      name: eventResult.name,
      date: new Date(eventResult.date),
      end_date: eventResult.end_date ? new Date(eventResult.end_date) : undefined,
      time: eventResult.time,
      description: eventResult.description || "",
      creatorId: eventResult.creator_id, // Map creator_id to creatorId
      all_day: eventResult.all_day || false,
      familyMembers: newEvent.familyMembers || [],
      familyMember: creatorProfile ? getCreatorDisplayName(creatorProfile, session.user.id) : session.user.id
    };
    
    console.log(`Returning created event "${eventName}" with ID ${createdEvent.id}`);
    
    // If there was an error with family member association, include it in the response
    if (familyMemberError) {
      return { 
        event: createdEvent, 
        error: `Event created, but there was an issue associating family members: ${familyMemberError}` 
      };
    }
    
    return { event: createdEvent, error: null };
  } catch (error: any) {
    console.error(`Error in addEventToDb for "${eventName}":`, error);
    const errorMessage = handleError(error, { 
      context: `Adding event "${eventName}"`,
      showToast: false // We'll let the calling function handle the toast
    });
    return { event: null, error: errorMessage };
  }
}
