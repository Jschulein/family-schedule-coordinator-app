
/**
 * Type definitions for simplified Supabase operations
 * Simplified to avoid excessive type recursion
 */
import type { Database } from "@/integrations/supabase/types";

// Define concrete type for database tables
export type DbTable = keyof Database['public']['Tables'];

/**
 * Simplified type for database function names
 */
export type DbFunction = string;

/**
 * Helper function to safely cast any string to DbFunction
 */
export function asFunctionName(name: string): DbFunction {
  return name;
}

/**
 * Standard response format for all database operations
 */
export interface DbResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Query options for database operations
 */
export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  order?: [string, 'asc' | 'desc'];
  limit?: number;
}

/**
 * Authentication response type
 */
export interface AuthStatusResponse {
  authenticated: boolean;
  userId?: string;
}
