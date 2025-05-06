
/**
 * Type definitions for simplified Supabase operations
 */
import type { Database } from "@/integrations/supabase/types";

// Define concrete type for database tables
export type DbTable = keyof Database['public']['Tables'];

// Define concrete type for database functions using string literal union type
// This constrains the functions to only known function names from the Database type
export type DbFunction = keyof Database['public']['Functions'] | string;

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
