
/**
 * Database function utilities
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbFunction, formatError, asFunctionName } from "./types";

/**
 * Executes an RPC function
 */
export async function callFunction<T = any>(
  functionName: DbFunction,
  params?: Record<string, any>
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Calling function ${functionName}`, params);
    
    // Use type assertion with 'any' to completely bypass TypeScript type checking
    // This allows us to call any function name at runtime without TypeScript errors
    const { data, error, status } = await (supabase.rpc as any)(functionName, params);
    
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
    // Use type assertion with 'any' to bypass TypeScript type checking for function names
    const { data, error } = await (supabase.rpc as any)('function_exists', { 
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
