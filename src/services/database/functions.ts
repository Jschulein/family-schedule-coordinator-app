
/**
 * Database function utilities
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbFunction, formatError } from "./types";
import type { Database } from "@/integrations/supabase/types";

/**
 * Executes an RPC function
 */
export async function callFunction<T = any>(
  functionName: DbFunction,
  params?: Record<string, any>
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Calling function ${functionName}`, params);
    
    // Using type assertion with 'as string' to handle dynamic function names
    // TypeScript will not allow direct string assignment to the strongly typed parameter
    // but this is necessary for runtime flexibility
    const { data, error, status } = await supabase
      .rpc(functionName as string, params);
    
    if (error) {
      console.error(`Error calling function ${functionName}:`, error);
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    return {
      data: data as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception calling function ${functionName}:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}

/**
 * Checks if a database function exists
 * Note: This requires appropriate permissions
 */
export async function checkFunctionExists(functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('function_exists', { 
      function_name: functionName 
    });
    
    if (error) {
      console.error(`Error checking if function exists:`, error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error(`Exception checking if function exists:`, err);
    return false;
  }
}
