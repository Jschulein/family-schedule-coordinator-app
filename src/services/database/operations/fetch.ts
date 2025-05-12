
/**
 * Database fetch operations
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbTable, QueryOptions, formatError } from "../types";

/**
 * Fetches data from a table with optional filters
 * Using proper type assertions to avoid excessive type recursion
 */
export async function fetchData<T>(
  table: DbTable, 
  options: QueryOptions = {}
): Promise<DatabaseResponse<T[]>> {
  try {
    console.log(`Fetching from ${table} with options:`, options);
    
    // Start building the query
    let query = supabase.from(table).select(options.select || '*');
    
    // Apply filters if they exist
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        // Only apply filter if value is defined
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    
    // Apply order if specified
    if (options.order) {
      query = query.order(options.order[0], { ascending: options.order[1] === 'asc' });
    }
    
    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    // Execute the query
    const { data, error, status } = await query;
    
    if (error) {
      console.error(`Error fetching from ${table}:`, error);
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    // Break the deep type recursion by using a two-step casting approach
    return {
      data: (data as unknown) as T[],
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception fetching from ${table}:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}

/**
 * Fetches a single record by ID
 */
export async function fetchById<T>(
  table: DbTable, 
  id: string,
  select: string = '*'
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Fetching ${table} with id ${id}`);
    
    const { data, error, status } = await supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching ${table} by id:`, error);
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    // Break the deep type recursion with a two-step cast
    return {
      data: (data as unknown) as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception fetching ${table} by id:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}
