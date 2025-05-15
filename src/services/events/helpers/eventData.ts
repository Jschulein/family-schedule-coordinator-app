
import { Event } from "@/types/eventTypes";

/**
 * Prepares event data for database operations
 * Ensures proper formatting for database compatibility
 */
export function prepareEventData(event: Event, userId: string) {
  // Create a formatted object for database insertion
  return {
    name: event.name,
    date: event.date.toISOString(),
    end_date: event.end_date ? event.end_date.toISOString() : event.date.toISOString(),
    time: event.time,
    description: event.description || "",
    creator_id: userId,
    all_day: event.all_day || false
  };
}

/**
 * Prepares event data for display in the UI
 * Converts database timestamps to Date objects
 */
export function formatEventForDisplay(dbEvent: any): Event {
  return {
    id: dbEvent.id,
    name: dbEvent.name,
    date: new Date(dbEvent.date),
    end_date: dbEvent.end_date ? new Date(dbEvent.end_date) : undefined,
    time: dbEvent.time,
    description: dbEvent.description || "",
    creatorId: dbEvent.creator_id,
    all_day: dbEvent.all_day || false,
    familyMembers: [] // Add the required field with default empty array
  };
}
