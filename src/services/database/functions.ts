
/**
 * Database function utilities with improved error handling
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Calls a database function with proper error handling
 * Compatible with the simplified implementation but with more robust type handling
 */
export async function callFunction<T>(
  functionName: string,
  params?: Record<string, any>
): Promise<{ data: T | null; error: any }> {
  try {
    // Use any type assertion to bypass TypeScript's recursive type checking limitations
    const { data, error } = await (supabase.rpc as any)(functionName, params);
    
    if (error) {
      console.error(`Error calling function ${functionName}:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error(`Exception calling function ${functionName}:`, err);
    return { data: null, error: err };
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
