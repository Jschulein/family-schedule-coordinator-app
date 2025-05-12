
/**
 * Database function utilities
 * Simplified to avoid TypeScript type recursion issues
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, formatError } from "./types";

/**
 * Executes an RPC function with simplified type handling
 */
export async function callFunction<T = any>(
  functionName: string,
  params?: Record<string, any>
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Calling function ${functionName}`, params);
    
    // Use a direct 'any' type assertion to completely bypass TypeScript errors
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
    // Use direct any type assertion for simplicity
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
