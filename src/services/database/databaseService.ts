
/**
 * Core database service with standardized CRUD operations
 */
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Standard response format for all database operations
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Checks if a user is authenticated
 * @returns Authentication status and user ID if authenticated
 */
export async function checkAuth(): Promise<{ authenticated: boolean, userId?: string }> {
  const { data } = await supabase.auth.getSession();
  return {
    authenticated: !!data.session,
    userId: data.session?.user.id
  };
}

/**
 * Fetches data from a table with optional filtering
 * @param table The table to query
 * @param options Query options
 */
export async function fetchData<T = any>(
  table: string, 
  options: {
    select?: string,
    filters?: Record<string, any>,
    order?: [string, 'asc' | 'desc'],
    limit?: number
  } = {}
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
      return {
        data: null,
        error: error.message,
        status: error.code ? parseInt(error.code) : 500
      };
    }
    
    return {
      data: data as T[],
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception fetching data from ${table}:`, err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred',
      status: 500
    };
  }
}

/**
 * Fetches a single record from a table by ID
 * @param table The table to query
 * @param id The record ID
 * @param options Query options
 */
export async function fetchById<T = any>(
  table: string, 
  id: string,
  options: { select?: string } = {}
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Fetching single record from ${table} with id ${id}`);
    
    const { data, error, status } = await supabase
      .from(table)
      .select(options.select || '*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error(`Error fetching record from ${table}:`, error);
      return {
        data: null,
        error: error.message,
        status: error.code ? parseInt(error.code) : 500
      };
    }
    
    return {
      data: data as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception fetching record from ${table}:`, err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred',
      status: 500
    };
  }
}

/**
 * Inserts a record into a table
 * @param table The table to insert into
 * @param data The data to insert
 */
export async function insertRecord<T = any>(
  table: string, 
  data: Partial<T>
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Inserting record into ${table}`, data);
    
    const { data: insertedData, error, status } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      return {
        data: null,
        error: error.message,
        status: error.code ? parseInt(error.code) : 500
      };
    }
    
    return {
      data: insertedData as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception inserting into ${table}:`, err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred',
      status: 500
    };
  }
}

/**
 * Updates a record in a table
 * @param table The table to update
 * @param id The record ID
 * @param data The data to update
 */
export async function updateRecord<T = any>(
  table: string, 
  id: string, 
  data: Partial<T>
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Updating record in ${table} with id ${id}`, data);
    
    const { data: updatedData, error, status } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating ${table}:`, error);
      return {
        data: null,
        error: error.message,
        status: error.code ? parseInt(error.code) : 500
      };
    }
    
    return {
      data: updatedData as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception updating ${table}:`, err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred',
      status: 500
    };
  }
}

/**
 * Deletes a record from a table
 * @param table The table to delete from
 * @param id The record ID
 */
export async function deleteRecord(
  table: string, 
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
      return {
        data: null,
        error: error.message,
        status: error.code ? parseInt(error.code) : 500
      };
    }
    
    return {
      data: null,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception deleting from ${table}:`, err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred',
      status: 500
    };
  }
}

/**
 * Executes an RPC function
 * @param functionName The function to call
 * @param params The parameters to pass
 */
export async function callFunction<T = any>(
  functionName: string,
  params?: Record<string, any>
): Promise<DatabaseResponse<T>> {
  try {
    console.log(`Calling function ${functionName}`, params);
    
    const { data, error, status } = await supabase
      .rpc(functionName, params);
    
    if (error) {
      console.error(`Error calling function ${functionName}:`, error);
      return {
        data: null,
        error: error.message,
        status: error.code ? parseInt(error.code) : 500
      };
    }
    
    return {
      data: data as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception calling function ${functionName}:`, err);
    return {
      data: null,
      error: err.message || 'An unexpected error occurred',
      status: 500
    };
  }
}
