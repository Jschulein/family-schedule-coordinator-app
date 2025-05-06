
/**
 * Database delete operations
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbTable, formatError } from "../types";

/**
 * Deletes a record from a table
 */
export async function deleteRecord(
  table: DbTable, 
  id: string
): Promise<DatabaseResponse<null>> {
  try {
    console.log(`Deleting record from ${table} with id ${id}`);
    
    const { error, status } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    return {
      data: null,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception deleting from ${table}:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}
