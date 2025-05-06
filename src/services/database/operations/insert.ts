
/**
 * Database insert operations
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbTable, formatError } from "../types";

/**
 * Inserts a record into a table
 * Uses a more specific approach with type assertions to avoid type errors
 */
export async function insertRecord<T extends Record<string, any>>(
  table: DbTable, 
  data: Record<string, any>
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Inserting record into ${table}`, data);
    
    // Use a more direct approach with type assertions to bypass TypeScript's type checking
    // This is necessary because the Supabase types are very specific and don't easily allow for generic use
    const { data: insertedData, error, status } = await supabase
      .from(table)
      .insert(data as any)
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    // Use double type assertion to safely convert to T
    return {
      data: insertedData as unknown as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception inserting into ${table}:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}
