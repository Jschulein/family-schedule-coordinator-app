
/**
 * Database utility functions for event-related operations
 */
import { supabase } from "@/integrations/supabase/client";
import { checkFunctionExists } from "@/services/database/functions";

/**
 * Check if a function exists in the database
 */
export const functionExists = checkFunctionExists;

/**
 * Check if a user has access to a specific event
 * Uses the security definer function to prevent RLS recursion
 * Includes fallback to alternative function names
 */
export const userCanAccessEvent = async (eventId: string): Promise<boolean> => {
  try {
    // Try the standard function first
    const standardFunction = 'user_can_access_event_safe';
    const altFunction = 'user_can_access_event';
    
    // Check if our preferred function exists
    const hasPrimaryFunction = await checkFunctionExists(standardFunction);
    
    if (hasPrimaryFunction) {
      const { data, error } = await supabase.rpc(
        standardFunction, 
        { event_id_param: eventId }
      );
      
      if (error) {
        console.error(`Error checking event access with ${standardFunction}:`, error);
        // Fall through to try alternative function
      } else {
        return !!data;
      }
    }
    
    // Try alternative function if primary failed or doesn't exist
    const hasAltFunction = await checkFunctionExists(altFunction);
    if (hasAltFunction) {
      const { data, error } = await supabase.rpc(
        altFunction, 
        { event_id_param: eventId }
      );
      
      if (error) {
        console.error(`Error checking event access with ${altFunction}:`, error);
        return false;
      }
      
      return !!data;
    }
    
    // Last resort fallback: direct query with type assertion
    // Use any type to bypass TypeScript restrictions for this emergency fallback
    const { data, error } = await (supabase.rpc as any)(
      'user_can_access_event_safe', 
      { event_id_param: eventId }
    );
    
    if (error) {
      console.error("Final fallback for event access check failed:", error);
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
 * Includes fallback mechanism
 */
export const getUserFamilies = async () => {
  try {
    // List of potential function names in order of preference
    const functionNames = ['get_user_families_safe', 'get_user_families'];
    
    // Try each function in sequence
    for (const funcName of functionNames) {
      // Check if this function exists
      const exists = await checkFunctionExists(funcName);
      if (!exists) continue;
      
      // Try to call the function
      try {
        const { data, error } = await supabase.rpc(funcName);
        
        if (!error) {
          return { data, error: null };
        }
      } catch (innerErr) {
        console.warn(`Error calling ${funcName}:`, innerErr);
        // Continue to next function
      }
    }
    
    // If we've exhausted all options, use a final fallback with type assertion
    const { data, error } = await (supabase.rpc as any)('get_user_families');
    
    if (error) {
      console.error("All getUserFamilies fallbacks failed:", error);
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (err: any) {
    console.error("Exception in getUserFamilies:", err);
    return { data: null, error: err.message || "An unexpected error occurred" };
  }
};
