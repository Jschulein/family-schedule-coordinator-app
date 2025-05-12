
/**
 * Database function operations for simplified Supabase service
 */
import { supabase } from "@/integrations/supabase/client";
import { DbResponse, DbFunction, asFunctionName } from "./types";

/**
 * Call a database function
 */
export async function callFunction<T>(
  functionName: DbFunction,
  params?: Record<string, any>
): Promise<DbResponse<T>> {
  try {
    // Use type assertion with 'any' to completely bypass TypeScript type checking
    // This allows us to call any function name at runtime without TypeScript errors
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
