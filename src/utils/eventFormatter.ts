
import { Event, UserProfile } from "@/types/eventTypes";

export function fromDbEvent(row: any, userMap: Record<string, UserProfile | undefined>): Event {
  const userProfile = userMap[row.creator_id];
  const familyMember =
    userProfile?.full_name ||
    userProfile?.Email ||
    row.creator_id?.slice(0, 8) || 
    "Unknown";
  
  return {
    id: row.id,
    name: row.name,
    date: new Date(row.date),
    end_date: row.end_date ? new Date(row.end_date) : undefined,
    time: row.time,
    description: row.description ?? "",
    familyMember,
    creatorId: row.creator_id,
    all_day: row.all_day || false
  };
}
