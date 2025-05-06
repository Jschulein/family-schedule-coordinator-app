
/**
 * Authentication operations for simplified Supabase service
 */
import { supabase } from "@/integrations/supabase/client";
import { AuthStatusResponse } from "./types";

/**
 * Check current authentication status
 */
export async function checkAuth(): Promise<AuthStatusResponse> {
  const { data } = await supabase.auth.getSession();
  return {
    authenticated: !!data.session,
    userId: data.session?.user.id
  };
}
