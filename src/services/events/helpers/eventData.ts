
import { Event } from "@/types/eventTypes";

/**
 * Prepares event data for database operations
 */
export function prepareEventData(event: Event, userId: string) {
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
