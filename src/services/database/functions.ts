
/**
 * Database function utilities with improved error handling
 */
import { supabase } from "@/integrations/supabase/client";

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
