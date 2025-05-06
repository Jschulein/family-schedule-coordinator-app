
/**
 * Core database operations for CRUD functionality
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbTable, QueryOptions, formatError } from "./types";
import type { Database } from "@/integrations/supabase/types";

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
    const { data: updatedData, error, status } = await supabase
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
