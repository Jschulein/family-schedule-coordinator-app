
import { Event, UserProfile } from "@/types/eventTypes";

/**
 * Converts a database event row to an Event object
 * 
 * @param row The raw database row from Supabase
 * @param userMap A map of user profiles by user ID for efficient lookup
 * @returns A properly formatted Event object
 */
export function fromDbEvent(row: any, userMap: Record<string, UserProfile | undefined>): Event {
  if (!row) {
    throw new Error("Cannot format undefined or null event");
  }
  
  // Get the creator profile from the user map, or use fallbacks if not found
  const userProfile = userMap[row.creator_id];
  const familyMember =
    userProfile?.full_name ||
    userProfile?.Email ||
    row.creator_id?.slice(0, 8) || 
    "Unknown";
  
  // Format dates properly
  const date = row.date ? new Date(row.date) : new Date();
  const end_date = row.end_date ? new Date(row.end_date) : undefined;
  
  return {
    id: row.id,
    name: row.name || "Untitled Event",
    date: date,
    end_date: end_date,
    time: row.time || "00:00",
    description: row.description ?? "",
    familyMember,
    familyMembers: row.familyMembers || [],
    creatorId: row.creator_id,
    all_day: row.all_day || false
  };
}

/**
 * Safely formats a date for database insertion
 * Ensures consistent date format across the application
 * 
 * @param date The date to format
 * @returns A properly formatted date string or null if date is invalid
 */
export function formatDateForDb(date: Date | null | undefined): string | null {
  if (!date || isNaN(date.getTime())) {
    return null;
  }
  
  return date.toISOString();
}

/**
 * Validates an event object before sending to the database
 * 
 * @param event The event to validate
 * @returns An object with validation result and any error messages
 */
export function validateEvent(event: Partial<Event>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!event.name || event.name.trim().length < 3) {
    errors.push("Event name must be at least 3 characters");
  }
  
  if (!event.date) {
    errors.push("Event date is required");
  }
  
  if (event.end_date && event.date && event.end_date < event.date) {
    errors.push("End date cannot be before start date");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
