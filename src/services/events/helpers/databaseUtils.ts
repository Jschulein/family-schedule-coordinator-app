
import { supabase } from "@/integrations/supabase/client";
import { PostgrestSingleResponse, PostgrestError } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Define the specific table types that are valid in our database
type DatabaseTable = keyof Database['public']['Tables'];

/**
 * Checks if a database function exists using a secure method
 * @param functionName The name of the function to check
 * @returns Whether the function exists in the database
 */
export async function functionExists(functionName: string): Promise<boolean> {
  try {
    // Call the special function_exists helper function with type assertion
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
 * Attempts to call a database function with fallbacks using type assertion
 * @param primaryFunction The primary function name to try first
 * @param fallbackFunction The fallback function to use if primary fails
 * @param params Parameters to pass to the function
 * @returns The result of the function call
 */
export async function callWithFallback<T>(
  primaryFunction: string, 
  fallbackFunction: string,
  params?: Record<string, any>
): Promise<PostgrestSingleResponse<T>> {
  try {
    console.log(`Attempting to call primary function: ${primaryFunction}`);
    
    // Use type assertion to bypass TypeScript's strict checking for RPC functions
    const result = await (supabase.rpc as any)(primaryFunction, params) as PostgrestSingleResponse<T>;
    
    if (result.error) {
      console.warn(`Error calling ${primaryFunction}, trying fallback ${fallbackFunction}:`, result.error);
      
      // Try fallback function with type assertion
      const fallbackResult = await (supabase.rpc as any)(fallbackFunction, params) as PostgrestSingleResponse<T>;
      
      if (fallbackResult.error) {
        console.error(`Fallback function ${fallbackFunction} also failed:`, fallbackResult.error);
      }
      
      return fallbackResult;
    }
    
    return result;
  } catch (error) {
    console.error(`Exception in callWithFallback for ${primaryFunction}/${fallbackFunction}:`, error);
    
    // Return a properly typed error response
    return {
      data: null,
      error: error as PostgrestError,
      count: null,
      status: 500,
      statusText: 'Internal Error'
    };
  }
}

// Define a simple result type to avoid deep instantiation issues
interface TableQueryResult<T> {
  data: T[] | null;
  error: PostgrestError | null;
  count: number | null;
  status: number;
  statusText: string;
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
): Promise<TableQueryResult<T>> {
  try {
    console.log(`Performing direct table query on ${table} as last resort`);
    
    // Initialize the query
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply filters if provided
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    // Apply ordering if provided
    if (options.order) {
      Object.entries(options.order).forEach(([column, direction]) => {
        query = query.order(column, { ascending: direction === 'asc' });
      });
    }
    
    // Execute the query and get the raw result
    const result = await query;
    
    // Return a properly structured response
    return {
      data: result.data as T[],
      error: result.error,
      count: result.count,
      status: result.status,
      statusText: result.statusText
    };
  } catch (error) {
    console.error(`Exception in directTableQuery for ${table}:`, error);
    
    // Return a properly typed error response
    return {
      data: null,
      error: error as PostgrestError,
      count: null,
      status: 500,
      statusText: 'Internal Error'
    };
  }
}
