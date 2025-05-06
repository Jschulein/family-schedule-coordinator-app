
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
