
/**
 * Database function operations for simplified Supabase service
 * With simplified type handling to avoid excessive type recursion
 */
import { supabase } from "@/integrations/supabase/client";
import { DbResponse } from "./types";

/**
 * Call a database function with simplified type handling
 */
export async function callFunction<T>(
  functionName: string,
  params?: Record<string, any>
): Promise<DbResponse<T>> {
  try {
    // Use direct any type assertion to completely bypass TypeScript type checking
    const { data, error } = await (supabase.rpc as any)(functionName, params);
    
    if (error) {
      console.error(`Error calling function ${functionName}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: data as T, error: null };
  } catch (err: any) {
    console.error(`Exception calling function ${functionName}:`, err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}
