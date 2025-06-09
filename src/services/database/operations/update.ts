
/**
 * Database update operations
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbTable, formatError } from "../types";

/**
 * Updates a record in a table
 */
export async function updateRecord<T extends Record<string, any>>(
  table: DbTable, 
  id: string, 
  data: Partial<T>
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Updating record in ${table} with id ${id}`, data);
    
    // Use type assertion to handle the generic constraint
    const { data: updatedData, error, status } = await (supabase as any)
      .from(table)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating ${table}:`, error);
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    return {
      data: updatedData as unknown as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception updating ${table}:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}
