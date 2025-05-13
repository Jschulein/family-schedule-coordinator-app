
/**
 * Database utility functions for event-related operations
 */
import { supabase } from "@/integrations/supabase/client";
import { checkFunctionExists, callFunction } from "@/services/database/functions";

/**
 * Check if a function exists in the database
 */
export const functionExists = checkFunctionExists;

/**
 * Check if a user has access to a specific event
 * Uses the security definer function to prevent RLS recursion
 */
export const userCanAccessEvent = async (eventId: string): Promise<boolean> => {
  try {
    const { data, error } = await callFunction<boolean>(
      'user_can_access_event_safe', 
      { event_id_param: eventId }
    );
    
    if (error) {
      console.error("Error checking event access:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Exception in userCanAccessEvent:", err);
    return false;
  }
};

/**
 * Get all families that the current user is a member of
 * Uses the security definer function to prevent RLS recursion
 */
export const getUserFamilies = async () => {
  try {
    const { data, error } = await callFunction('get_user_families');
    
    if (error) {
      console.error("Error fetching user families:", error);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (err: any) {
    console.error("Exception in getUserFamilies:", err);
    return { data: null, error: err.message || "An unexpected error occurred" };
  }
};
