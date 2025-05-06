
import { supabase } from "@/integrations/supabase/client";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Define the specific function types that are valid in our database
// These must match exactly the functions available in Supabase
type DatabaseFunction = 
  | "create_notification"
  | "delete_user_profile" 
  | "function_exists"
  | "get_all_family_members_for_user"
  | "get_families_and_members_for_user"
  | "get_family_members"
  | "get_family_members_by_family_id"
  | "get_family_members_safe"
  | "get_family_members_without_recursion"
  | "get_user_families"
  | "get_user_profile"
  | "handle_invitation_accept"
  | "handle_new_family"
  | "handle_new_user"
  | "is_event_owner"
  | "is_family_admin"
  | "is_family_member"
  | "is_user_in_family"
  | "is_user_in_family_safe"
  | "notify_on_family_invite"
  | "safe_create_family"
  | "safe_is_family_admin"
  | "safe_is_family_member"
  | "update_user_profile"
  | "user_can_access_event"
  | "user_families"
  | "user_is_admin_of_family"
  | "user_is_family_member"
  | "user_is_family_member_safe"
  | "user_is_in_family"
  | "user_is_in_family_safe"
  | "user_is_member_of_family";

// Define the specific table types that are valid in our database
type DatabaseTable = keyof Database['public']['Tables'];

/**
 * Checks if a database function exists using a secure method
 * @param functionName The name of the function to check
 * @returns Whether the function exists in the database
 */
export async function functionExists(functionName: string): Promise<boolean> {
  try {
    // Call the special function_exists helper function
    const { data, error } = await supabase.rpc('function_exists', {
      function_name: functionName
    });
    
    if (error) {
      console.error(`Error checking if function ${functionName} exists:`, error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error(`Exception checking if function ${functionName} exists:`, error);
    return false;
  }
}

/**
 * Attempts to call a database function with fallbacks
 * @param primaryFunction The primary function name to try first
 * @param fallbackFunction The fallback function to use if primary fails
 * @param params Parameters to pass to the function
 * @returns The result of the function call
 */
export async function callWithFallback<T>(
  primaryFunction: DatabaseFunction, 
  fallbackFunction: DatabaseFunction,
  params?: Record<string, any>
): Promise<PostgrestSingleResponse<T>> {
  try {
    console.log(`Attempting to call primary function: ${primaryFunction}`);
    
    // Use type assertion to tell TypeScript this is safe
    const result = await supabase.rpc(primaryFunction, params) as PostgrestSingleResponse<T>;
    
    if (result.error) {
      console.warn(`Error calling ${primaryFunction}, trying fallback ${fallbackFunction}:`, result.error);
      
      // Try fallback function with type assertion
      const fallbackResult = await supabase.rpc(fallbackFunction, params) as PostgrestSingleResponse<T>;
      
      if (fallbackResult.error) {
        console.error(`Fallback function ${fallbackFunction} also failed:`, fallbackResult.error);
      }
      
      return fallbackResult;
    }
    
    return result;
  } catch (error) {
    console.error(`Exception in callWithFallback for ${primaryFunction}/${fallbackFunction}:`, error);
    
    // Create a complete PostgrestSingleResponse object
    return {
      data: null as unknown as T,
      error: error as any,
      count: null,
      status: 500,
      statusText: 'Internal Error'
    };
  }
}

/**
 * Performs a direct database query as a last resort fallback
 * @param table Table to query
 * @param options Query options
 * @returns Query result
 */
export async function directTableQuery<T>(
  table: DatabaseTable,
  options: {
    select?: string,
    filter?: Record<string, any>,
    order?: Record<string, any>
  }
): Promise<PostgrestSingleResponse<T>> {
  try {
    console.log(`Performing direct table query on ${table} as last resort`);
    
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply filters if provided
    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        query = query.eq(key, value);
      }
    }
    
    // Apply ordering if provided
    if (options.order) {
      for (const [column, direction] of Object.entries(options.order)) {
        query = query.order(column, { ascending: direction === 'asc' });
      }
    }
    
    const result = await query;
    
    // Transform to PostgrestSingleResponse
    return {
      data: result.data as unknown as T,
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  } catch (error) {
    console.error(`Exception in directTableQuery for ${table}:`, error);
    
    // Create a complete PostgrestSingleResponse object
    return {
      data: null as unknown as T,
      error: error as any,
      count: null,
      status: 500,
      statusText: 'Internal Error'
    };
  }
}
