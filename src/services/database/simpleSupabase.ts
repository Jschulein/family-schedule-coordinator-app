
/**
 * Simplified Supabase database service
 * Using direct, type-safe approaches to interact with Supabase
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Json } from "@/integrations/supabase/types";

// Define concrete type for database tables
export type DbTable = keyof Database['public']['Tables'];

// Define concrete type for database functions (using string for flexibility)
export type DbFunction = string;

/**
 * Standard response format for all database operations
 */
export interface DbResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Check current authentication status
 */
export async function checkAuth(): Promise<{ authenticated: boolean; userId?: string }> {
  const { data } = await supabase.auth.getSession();
  return {
    authenticated: !!data.session,
    userId: data.session?.user.id
  };
}

/**
 * Fetch data from a specific table with optional filtering
 */
export async function getData<T>(
  table: DbTable, 
  options: {
    select?: string;
    filters?: Record<string, any>;
    order?: [string, 'asc' | 'desc'];
    limit?: number;
  } = {}
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

/**
 * Insert a new record
 * Uses Partial<T> to allow for auto-generated fields
 */
export async function insert<T extends Record<string, any>>(
  table: DbTable,
  data: Partial<T>
): Promise<DbResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      return { data: null, error: error.message };
    }
    
    // Use as unknown as T to handle the type conversion safely
    return { data: result as unknown as T, error: null };
  } catch (err: any) {
    console.error(`Exception inserting into ${table}:`, err);
    return { data: null, error: err.message || 'An unexpected error occurred' };
  }
}

/**
 * Update an existing record
 */
export async function update<T extends Record<string, any>>(
  table: DbTable,
  id: string,
  data: Partial<T>
): Promise<DbResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating record in ${table}:`, error);
      return { data: null, error: error.message };
    }
    
    // Use as unknown as T to handle the type conversion safely
    return { data: result as unknown as T, error: null };
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
      .from(table)
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

/**
 * Call a database function
 */
export async function callFunction<T>(
  functionName: DbFunction,
  params?: Record<string, any>
): Promise<DbResponse<T>> {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
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
