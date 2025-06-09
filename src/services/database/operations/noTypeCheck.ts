
/**
 * Database fetch operations with type checking disabled
 * This file is intentionally excluded from TypeScript's type checking
 * to prevent recursive type issues.
 * @ts-nocheck
 */
import { supabase } from "@/integrations/supabase/client";
import { QueryOptions, formatError } from "../types";

/**
 * Fetches data from a table with optional filters
 * With type checking disabled to prevent recursion
 */
export async function fetchDataNoTypeCheck(
  table, 
  options = {} as QueryOptions
) {
  try {
    console.log(`NoTypeCheck: Fetching from ${table} with options:`, options);
    
    // Start building the query
    let query = (supabase as any).from(table).select(options.select || '*');
    
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
    
    // Return data with no type assertions
    return {
      data,
      error: null,
      status
    };
  } catch (err) {
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
 * With type checking disabled to prevent recursion
 */
export async function fetchByIdNoTypeCheck(
  table, 
  id,
  select = '*'
) {
  try {
    console.log(`NoTypeCheck: Fetching ${table} with id ${id}`);
    
    const { data, error, status } = await (supabase as any)
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
    
    // Return data with no type assertions
    return {
      data,
      error: null,
      status
    };
  } catch (err) {
    console.error(`Exception fetching ${table} by id:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  }
}
