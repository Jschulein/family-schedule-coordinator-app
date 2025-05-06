
import { supabase } from "@/integrations/supabase/client";
import { PostgrestSingleResponse, PostgrestError } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Define the specific function types that are valid in our database
// Use a string literal union type for proper type checking
type DatabaseFunction = string;

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
    
    // Use any to bypass TypeScript's strict checking for RPC functions
    const result = await (supabase.rpc as any)(primaryFunction, params);
    
    if (result.error) {
      console.warn(`Error calling ${primaryFunction}, trying fallback ${fallbackFunction}:`, result.error);
      
      // Try fallback function
      const fallbackResult = await (supabase.rpc as any)(fallbackFunction, params);
      
      if (fallbackResult.error) {
        console.error(`Fallback function ${fallbackFunction} also failed:`, fallbackResult.error);
      }
      
      // Return the properly typed result
      return fallbackResult as PostgrestSingleResponse<T>;
    }
    
    // Return the properly typed result
    return result as PostgrestSingleResponse<T>;
  } catch (error) {
    console.error(`Exception in callWithFallback for ${primaryFunction}/${fallbackFunction}:`, error);
    
    // Create a complete PostgrestSingleResponse object with the correct structure
    return {
      data: null,
      error: error as PostgrestError,
      count: null,
      status: 500,
      statusText: 'Internal Error'
    } as PostgrestSingleResponse<T>;
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
    
    // Initialize the query
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply filters if provided - using a simpler approach to avoid deep type recursion
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        // Use type casting to avoid TypeScript errors
        query = (query as any).eq(key, value);
      });
    }
    
    // Apply ordering if provided - using a simpler approach to avoid deep type recursion
    if (options.order) {
      Object.entries(options.order).forEach(([column, direction]) => {
        // Use type casting to avoid TypeScript errors
        query = (query as any).order(column, { ascending: direction === 'asc' });
      });
    }
    
    // Execute the query
    const result = await query;
    
    // Create a properly structured PostgrestSingleResponse
    return {
      data: result.data as unknown as T,
      error: result.error,
      count: null,
      status: result.status,
      statusText: result.statusText
    } as PostgrestSingleResponse<T>;
  } catch (error) {
    console.error(`Exception in directTableQuery for ${table}:`, error);
    
    // Create a complete PostgrestSingleResponse object with the correct structure
    return {
      data: null,
      error: error as PostgrestError,
      count: null,
      status: 500,
      statusText: 'Internal Error'
    } as PostgrestSingleResponse<T>;
  }
}
