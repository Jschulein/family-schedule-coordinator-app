
/**
 * Database fetch operations
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, DbTable, QueryOptions, formatError } from "../types";
import { fetchDataNoTypeCheck, fetchByIdNoTypeCheck } from "./noTypeCheck";

/**
 * Fetches data from a table with optional filters
 * Uses a type-boundary approach to avoid deep type recursion
 */
export async function fetchData<T>(
  table: DbTable, 
  options: QueryOptions = {}
): Promise<DatabaseResponse<T[]>> {
  // Delegate to the no-type-check implementation 
  const result = await fetchDataNoTypeCheck(table, options);
  
  // Return with appropriate typing at the boundary
  return {
    data: result.data as T[],
    error: result.error,
    status: result.status
  };
}

/**
 * Fetches a single record by ID
 * Uses a type-boundary approach to avoid deep type recursion
 */
export async function fetchById<T>(
  table: DbTable, 
  id: string,
  select: string = '*'
): Promise<DatabaseResponse<T>> {
  // Delegate to the no-type-check implementation
  const result = await fetchByIdNoTypeCheck(table, id, select);
  
  // Return with appropriate typing at the boundary
  return {
    data: result.data as T,
    error: result.error,
    status: result.status
  };
}
