
/**
 * Data mutation operations for simplified Supabase service
 */
import { supabase } from "@/integrations/supabase/client";
import { DbResponse, DbTable } from "./types";

/**
 * Insert a new record
 * Uses type assertion to avoid generic type issues
 */
export async function insert<T>(
  table: DbTable,
  data: Record<string, any>
): Promise<DbResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table as any)
      .insert(data as any)
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: result as T, error: null };
  } catch (err: any) {
    console.error(`Exception inserting into ${table}:`, err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Update an existing record
 */
export async function update<T>(
  table: DbTable,
  id: string,
  data: Record<string, any>
): Promise<DbResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table as any)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating record in ${table}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: result as T, error: null };
  } catch (err: any) {
    console.error(`Exception updating record in ${table}:`, err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Delete a record
 */
export async function remove(
  table: DbTable,
  id: string
): Promise<DbResponse<null>> {
  try {
    const { error } = await supabase
      .from(table as any)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting record from ${table}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: null, error: null };
  } catch (err: any) {
    console.error(`Exception deleting record from ${table}:`, err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}
