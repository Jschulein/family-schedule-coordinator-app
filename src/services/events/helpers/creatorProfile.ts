
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches profile information for the event creator
 */
export async function fetchCreatorProfile(userId: string) {
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, Email')
    .eq('id', userId)
    .single();
  
  return profileData;
}

/**
 * Gets display name for the event creator
 */
export function getCreatorDisplayName(profile: any, userId: string) {
  return profile?.full_name || profile?.Email || userId.slice(0, 8) || "Unknown";
}
