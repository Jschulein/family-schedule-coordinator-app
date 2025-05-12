
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
 * Type-safe wrapper for database function names
 * This creates a branded type that can accept string values at runtime
 * while maintaining compile-time type checking
 */
export type DbFunction = keyof Database['public']['Functions'] | 
  (string & { __brand: 'DbFunctionName' });

/**
 * Helper function to safely cast any string to DbFunction
 * This provides a clean escape hatch for the type system
 */
export function asFunctionName(name: string): DbFunction {
  return name as DbFunction;
}

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
