
/**
 * Common types for database operations
 */

import { PostgrestError } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Standard response format for all database operations
 */
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Type for database tables 
 */
export type DbTable = keyof Database['public']['Tables'];

/**
 * Type for database functions - allowing both string and strong typing
 */
export type DbFunction = keyof Database['public']['Functions'] | string;

/**
 * Query options for fetching data
 */
export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  order?: [string, 'asc' | 'desc'];
  limit?: number;
}

/**
 * Helper to convert PostgrestError to a standardized error response
 */
export function formatError(error: PostgrestError | Error | unknown): { message: string; status: number } {
  if (!error) {
    return { message: 'Unknown error', status: 500 };
  }
  
  // Handle PostgrestError
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError;
    const status = pgError.code ? parseInt(pgError.code, 10) : 500;
    return {
      message: pgError.message,
      status: !isNaN(status) ? status : 500
    };
  }
  
  // Handle standard Error
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500
    };
  }
  
  // Handle string error
  if (typeof error === 'string') {
    return {
      message: error,
      status: 400
    };
  }
  
  // Handle unknown error
  return {
    message: 'An unexpected error occurred',
    status: 500
  };
}
