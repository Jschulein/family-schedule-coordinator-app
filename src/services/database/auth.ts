
/**
 * Authentication-related database utilities
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse } from "./types";

/**
 * Checks if a user is authenticated
 * @returns Authentication status and user ID if authenticated
 */
export async function checkAuth(): Promise<{ authenticated: boolean, userId?: string }> {
  const { data } = await supabase.auth.getSession();
  return {
    authenticated: !!data.session,
    userId: data.session?.user.id
  };
}

/**
 * Get the current user's ID
 * @returns User ID if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id || null;
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<DatabaseResponse<null>> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return {
        data: null,
        error: error.message,
        status: 400
      };
    }
    
    return {
      data: null,
      error: null,
      status: 200
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'An error occurred during sign out',
      status: 500
    };
  }
}
