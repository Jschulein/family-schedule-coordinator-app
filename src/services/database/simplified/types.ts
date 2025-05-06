
/**
 * Type definitions for simplified Supabase operations
 */
import type { Database } from "@/integrations/supabase/types";

// Define concrete type for database tables
export type DbTable = keyof Database['public']['Tables'];

// Define concrete type for database functions that allows both known functions and string literals
// Using string & {} pattern to allow string literals while maintaining type information
export type DbFunction = keyof Database['public']['Functions'] | (string & {});

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
