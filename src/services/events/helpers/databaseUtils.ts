
import { supabase } from "@/integrations/supabase/client";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Use more specific typing that matches the actual database functions
type DatabaseFunction = keyof Database["public"]["Functions"]

// Create a type for valid table names
type DatabaseTable = keyof Database["public"]["Tables"]

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
    
    // Call the primary function with a type assertion to help TypeScript
    const result = await supabase.rpc(primaryFunction as string, params);
    
    if (result.error) {
      console.warn(`Error calling ${primaryFunction}, trying fallback ${fallbackFunction}:`, result.error);
      
      // Try fallback function with a type assertion
      const fallbackResult = await supabase.rpc(fallbackFunction as string, params);
      
      if (fallbackResult.error) {
        console.error(`Fallback function ${fallbackFunction} also failed:`, fallbackResult.error);
      }
      
      // Return the fallback result with type assertion
      return fallbackResult as PostgrestSingleResponse<T>;
    }
    
    // Return the successful primary function result with type assertion
    return result as PostgrestSingleResponse<T>;
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
    let query = supabase.from(table as string).select(options.select || '*');
    
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
    
    if (result.error) {
      console.error(`Direct table query on ${table} failed:`, result.error);
      throw result.error;
    }
    
    // Properly construct the PostgrestSingleResponse object
    return {
      data: result.data as unknown as T,
      error: null,
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
