
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches profile information for the event creator
 * Returns a Promise to allow proper await/error handling
 */
export async function fetchCreatorProfile(userId: string) {
  try {
    if (!userId) {
      console.error("Cannot fetch profile: No user ID provided");
      return null;
    }
    
    console.log("Fetching creator profile for user:", userId);
    
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('full_name, Email')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching creator profile:", error);
      return null;
    }
    
    if (!profileData) {
      console.warn("No profile found for user:", userId);
      return null;
    }
    
    console.log("Retrieved profile:", profileData);
    return profileData;
  } catch (error) {
    console.error("Unexpected error in fetchCreatorProfile:", error);
    return null;
  }
}

/**
 * Gets display name for the event creator
 */
export function getCreatorDisplayName(profile: any, userId: string) {
  if (!profile) {
    return userId.slice(0, 8) || "Unknown";
  }
  
  if (profile.full_name && profile.full_name.trim() !== '') {
    return profile.full_name;
  }
  
  if (profile.Email && profile.Email.trim() !== '') {
    return profile.Email;
  }
  
  return userId.slice(0, 8) || "Unknown";
}
