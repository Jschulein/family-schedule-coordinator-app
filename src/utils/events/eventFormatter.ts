
import { Event } from "@/types/eventTypes";

/**
 * Formats event data from database to frontend format
 * Ensures all field names match the frontend Event interface
 */
export function formatEventForDisplay(dbEvent: any): Event {
  return {
    id: dbEvent.id,
    name: dbEvent.name,
    date: new Date(dbEvent.date),
    end_date: dbEvent.end_date ? new Date(dbEvent.end_date) : undefined,
    time: dbEvent.time,
    description: dbEvent.description || "",
    creatorId: dbEvent.creator_id, // Map database creator_id to creatorId
    all_day: dbEvent.all_day || false,
    familyMembers: dbEvent.family_members || [] // Assuming family_members might be included
  };
}

/**
 * Formats event data from frontend to database format
 * Ensures all field names match the database schema
 */
export function formatEventForDatabase(event: Event): any {
  return {
    id: event.id,
    name: event.name,
    date: event.date.toISOString(),
    end_date: event.end_date ? event.end_date.toISOString() : event.date.toISOString(),
    time: event.time,
    description: event.description || "",
    creator_id: event.creatorId, // Map frontend creatorId to creator_id
    all_day: event.all_day || false,
    // family_members are handled separately through associations
  };
}

/**
 * Transforms a database event object to frontend Event format
 * Also includes creator profile information if available
 * 
 * @param dbEvent Raw event object from the database
 * @param userMap Optional map of user profiles by ID
 * @returns Formatted Event object for frontend use
 */
export function fromDbEvent(dbEvent: any, userMap: Record<string, any> = {}): Event {
  if (!dbEvent) {
    throw new Error("Cannot format null or undefined event");
  }
  
  // Extract creator profile if available in the userMap
  const creatorId = dbEvent.creator_id;
  const creatorProfile = creatorId ? userMap[creatorId] : undefined;
  
  // Create the familyMember field from creator profile if available
  let familyMember = "Unknown";
  if (creatorProfile) {
    familyMember = creatorProfile.full_name || creatorProfile.Email || "Unknown";
  }
  
  return {
    id: dbEvent.id,
    name: dbEvent.name || "Untitled Event",
    date: dbEvent.date ? new Date(dbEvent.date) : new Date(),
    end_date: dbEvent.end_date ? new Date(dbEvent.end_date) : undefined,
    time: dbEvent.time || "00:00",
    description: dbEvent.description || "",
    creatorId: creatorId || "",
    all_day: dbEvent.all_day || false,
    familyMember, // Include the creator name
    familyMembers: dbEvent.familyMembers || dbEvent.family_members || []
  };
}

