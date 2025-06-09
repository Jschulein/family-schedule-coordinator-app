
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

/**
 * Result of session validation
 */
export type SessionValidationResult = {
  valid: boolean;
  error?: string;
  user?: User | null;
};

/**
 * Simple, direct session validation that checks if the user has a valid session
 * @returns Promise with validation result
 */
export async function validateSession(): Promise<SessionValidationResult> {
  try {
    // Get current session - simplified approach
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return { 
        valid: false, 
        error: `Session error: ${sessionError.message}`
      };
    }
    
    if (!session || !session.user) {
      return {
        valid: false,
        error: "No active session found"
      };
    }
    
    // Verify the session with the server by making a simple data request
    const { error: testError } = await (supabase.rpc as any)('can_create_event');
    
    // If we get an auth error on this test request, the session isn't fully ready
    if (testError && (
      testError.message.includes('JWT') || 
      testError.message.includes('auth') || 
      testError.message.includes('permission'))) {
      return {
        valid: false,
        error: "Session not fully established on server",
        user: session.user
      };
    }
    
    // If we have a session with a user and can access functions, consider it valid
    return {
      valid: true,
      user: session.user
    };
  } catch (error: any) {
    console.error("Error during session validation:", error);
    return {
      valid: false,
      error: error?.message || "Unexpected error during session validation"
    };
  }
}

/**
 * Enhanced helper to wrap operations that need valid authentication
 * Uses exponential backoff to avoid deadlocks and handle transient auth issues
 * 
 * @param operation Function to execute if session is valid, receives session object
 * @param maxRetries Optional number of retries (default: 3)
 * @returns Result of the operation
 */
export async function withValidSession<T>(
  operation: (session: { user: User | null }) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  // First check if session is valid before attempting operation
  const sessionCheck = await validateSession();
      
  if (!sessionCheck.valid) {
    throw new Error(`Authentication required: ${sessionCheck.error}`);
  }
  
  // Create a session object to pass to the operation
  const session = { user: sessionCheck.user };
  let lastError: any = null;
  
  // Try the operation with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Session is valid, execute operation with session
      return await operation(session);
    } catch (error: any) {
      lastError = error;
      
      // Only retry if it's clearly a session-related error and we have retries left
      const isAuthError = String(error).includes('authentication') || 
                          String(error).includes('policy') || 
                          String(error).includes('permission') ||
                          String(error).includes('not authorized') ||
                          String(error).includes('violates row-level security');
      
      if (attempt < maxRetries && isAuthError) {
        // Calculate exponential backoff with jitter
        const baseDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s...
        const jitter = Math.random() * 500; // Add up to 500ms of random jitter
        const delay = baseDelay + jitter;
        
        console.log(`Operation failed with auth error, retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
        
        // Wait with exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Not a session error or out of retries, rethrow
      throw error;
    }
  }
  
  // If we get here, we've exhausted all retries
  throw lastError || new Error("Operation failed after multiple retries");
}

// Import useState and useEffect at the top of the file
import { useState, useEffect } from 'react';

/**
 * Simplified hook for accessing session status
 */
export function useSessionStatus() {
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        const result = await validateSession();
        
        if (isMounted) {
          setIsSessionValid(result.valid);
          setSessionError(result.error || null);
          setIsSessionChecked(true);
        }
      } catch (error: any) {
        if (isMounted) {
          setIsSessionValid(false);
          setSessionError(error?.message || "Unknown error checking session");
          setIsSessionChecked(true);
        }
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  return {
    isSessionValid,
    isSessionChecked,
    sessionError
  };
}
