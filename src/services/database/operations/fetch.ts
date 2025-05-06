
/**
 * Database fetch operations
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbTable, QueryOptions, formatError } from "../types";

/**
 * Fetches data from a table with optional filtering
 */
export async function fetchData<T = any>(
  table: DbTable, 
  options: QueryOptions = {}
): Promise<DatabaseResponse<T[]>> {
  try {
    console.log(`Fetching data from ${table}`, options);
    
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply filters if any
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }
    
    // Apply ordering if specified
    if (options.order) {
      const [column, direction] = options.order;
      query = query.order(column, { ascending: direction === 'asc' });
    }
    
    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error, status } = await query;
    
    if (error) {
      console.error(`Error fetching data from ${table}:`, error);
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    return {
      data: data as T[],
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception fetching data from ${table}:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}

/**
 * Fetches a single record from a table by ID
 */
export async function fetchById<T = any>(
  table: DbTable, 
  id: string,
  options: { select?: string } = {}
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Fetching record from ${table} with id ${id}`);
    
    const { data, error, status } = await supabase
      .from(table)
      .select(options.select || '*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching record from ${table}:`, error);
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    return {
      data: data as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception fetching record from ${table}:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}
