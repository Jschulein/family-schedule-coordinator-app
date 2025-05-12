
/**
 * Type definitions for simplified Supabase operations
 */
import type { Database } from "@/integrations/supabase/types";

// Define concrete type for database tables
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
