
/**
 * Data fetching operations for simplified Supabase service
 */
import { supabase } from "@/integrations/supabase/client";
import { DbResponse, DbTable, QueryOptions } from "./types";

/**
 * Fetch data from a specific table with optional filtering
 */
export async function getData<T>(
  table: DbTable, 
  options: QueryOptions = {}
): Promise<DbResponse<T[]>> {
  try {
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    // Apply order
    if (options.order) {
      const [column, direction] = options.order;
      query = query.order(column, { ascending: direction === 'asc' });
    }
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: data as T[], error: null };
  } catch (err: any) {
    console.error(`Exception fetching data from ${table}:`, err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Get a single record by ID
 */
export async function getById<T>(
  table: DbTable,
  id: string,
  select?: string
): Promise<DbResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(select || '*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching record from ${table}:`, error);
      return { data: null, error: error.message };
    }
    
    return { data: data as T, error: null };
  } catch (err: any) {
    console.error(`Exception fetching record by ID from ${table}:`, err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}
