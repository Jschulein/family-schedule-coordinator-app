
/**
 * Simplified Supabase service wrapper
 * Focused on specific database operations without complex fallbacks
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

/**
 * Get the current user ID if authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id || null;
}

/**
 * Format a database error into a user-friendly message
 */
export function formatErrorMessage(error: any): string {
  if (!error) return "Unknown error";
  
  // Return specific message if available
  if (error.message) return error.message;
  
  // Handle specific Postgres error codes
  if (error.code) {
    switch(error.code) {
      case '23505': return 'This record already exists.';
      case '23503': return 'This record references data that doesn\'t exist.';
      case '42P01': return 'The requested table doesn\'t exist.';
      default: return `Database error: ${error.code}`;
    }
  }
  
  return "An unexpected error occurred";
}

/**
 * Create a standardized error object
 */
export function createErrorResponse(message: string): { error: string; status: number } {
  return {
    error: message,
    status: 400
  };
}
