
import { supabase } from "@/integrations/supabase/client";

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
export async function callWithFallback(
  primaryFunction: string,
  fallbackFunction: string,
  params?: Record<string, any>
) {
  try {
    console.log(`Attempting to call primary function: ${primaryFunction}`);
    const { data, error } = await supabase.rpc(primaryFunction, params);
    
    if (error) {
      console.warn(`Error calling ${primaryFunction}, trying fallback ${fallbackFunction}:`, error);
      const { data: fallbackData, error: fallbackError } = await supabase.rpc(fallbackFunction, params);
      
      if (fallbackError) {
        console.error(`Fallback function ${fallbackFunction} also failed:`, fallbackError);
        throw fallbackError;
      }
      
      return { data: fallbackData, error: null };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in callWithFallback for ${primaryFunction}/${fallbackFunction}:`, error);
    return { data: null, error };
  }
}

/**
 * Performs a direct database query as a last resort fallback
 * @param table Table to query
 * @param options Query options
 * @returns Query result
 */
export async function directTableQuery(table: string, options: {
  select?: string,
  filter?: Record<string, any>,
  order?: Record<string, any>
}) {
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
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Direct table query on ${table} failed:`, error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error(`Exception in directTableQuery for ${table}:`, error);
    return { data: null, error };
  }
}
