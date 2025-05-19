
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
    
    // If we have a session with a user, consider it valid
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
 * Simplified helper to wrap operations that need valid authentication
 * Reduces reliance on retry logic to avoid deadlocks
 * 
 * @param operation Function to execute if session is valid
 * @param maxRetries Optional number of retries (default: 1)
 * @returns Result of the operation
 */
export async function withValidSession<T>(
  operation: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  // First check if session is valid before attempting operation
  const sessionCheck = await validateSession();
      
  if (!sessionCheck.valid) {
    throw new Error(`Authentication required: ${sessionCheck.error}`);
  }
  
  try {
    // Session is valid, execute operation
    return await operation();
  } catch (error: any) {
    // Only retry if it's clearly a session-related error and we have retries left
    if (maxRetries > 0 && 
        (String(error).includes('authentication') || 
         String(error).includes('policy') || 
         String(error).includes('permission') ||  
         String(error).includes('not authorized'))) {
      
      console.log(`Operation failed with auth error, retrying...`);
      
      // Simple delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recursive retry with one fewer retry attempt
      return withValidSession(operation, maxRetries - 1);
    }
    
    // Not a session error or out of retries, rethrow
    throw error;
  }
}

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

// Import useState and useEffect at the top of the file
import { useState, useEffect } from 'react';
