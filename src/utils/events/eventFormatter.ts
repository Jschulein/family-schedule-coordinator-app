
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
