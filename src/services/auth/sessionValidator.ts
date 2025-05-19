/**
 * Session validation service - simplified to reduce complexity and redundancy
 */
import { supabase } from "@/integrations/supabase/client";

export type SessionValidationResult = {
  valid: boolean;
  userId?: string;
  error?: string;
  timestamp: number;
};

/**
 * Validates that the current session is fully established and valid
 */
export async function validateSession(): Promise<SessionValidationResult> {
  try {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session validation error:", error);
      return {
        valid: false,
        error: `Session error: ${error.message}`,
        timestamp: Date.now()
      };
    }
    
    if (!session) {
      return {
        valid: false,
        error: "No active session found",
        timestamp: Date.now()
      };
    }
    
    // If we have a valid user ID, the session is valid
    if (session.user?.id) {
      return {
        valid: true,
        userId: session.user.id,
        timestamp: Date.now()
      };
    }
    
    // Otherwise, the session is invalid
    return {
      valid: false,
      error: "Invalid session data",
      timestamp: Date.now()
    };
  } catch (e: any) {
    return {
      valid: false,
      error: `Unexpected error: ${e.message}`,
      timestamp: Date.now()
    };
  }
}

/**
 * Wait for valid session with reasonable timeout
 */
export async function waitForValidSession(maxWaitTime = 5000): Promise<SessionValidationResult> {
  const startTime = Date.now();
  
  // First immediate check
  const initialCheck = await validateSession();
  if (initialCheck.valid) {
    return initialCheck;
  }
  
  return new Promise((resolve, reject) => {
    const interval = 300;
    
    const checkSession = async () => {
      const result = await validateSession();
      
      if (result.valid) {
        resolve(result);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed >= maxWaitTime) {
        reject(new Error(`Session validation timed out: ${result.error}`));
        return;
      }
      
      setTimeout(checkSession, interval);
    };
    
    setTimeout(checkSession, interval);
  });
}

/**
 * Utility for operations that require authentication
 */
export async function withValidSession<T>(
  operation: () => Promise<T>
): Promise<T> {
  const validation = await validateSession();
  
  if (!validation.valid) {
    throw new Error(`Cannot proceed - not authenticated: ${validation.error}`);
  }
  
  try {
    return await operation();
  } catch (error: any) {
    // If this looks like an auth error, we should invalidate our session
    if (
      error.message?.includes?.("not authorized") ||
      error.message?.includes?.("JWT") ||
      error.message?.includes?.("permission")
    ) {
      // Attempt to refresh the session
      await supabase.auth.refreshSession();
    }
    
    throw error;
  }
}
