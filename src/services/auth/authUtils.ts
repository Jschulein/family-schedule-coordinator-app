
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
    // Get current session
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
 * Helper to wrap operations that need valid authentication
 * Simpler replacement for the previous withValidSession function
 * 
 * @param operation Function to execute if session is valid
 * @param maxRetries Optional number of retries (default: 1)
 * @returns Result of the operation
 */
export async function withValidSession<T>(
  operation: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  let attempts = 0;
  let lastError: any = null;

  while (attempts <= maxRetries) {
    try {
      // Validate session before operation
      const sessionCheck = await validateSession();
      
      if (!sessionCheck.valid) {
        // If session is invalid and we have retries left, wait and retry
        if (attempts < maxRetries) {
          console.log(`Session validation failed (attempt ${attempts + 1}/${maxRetries + 1}): ${sessionCheck.error}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
          attempts++;
          continue;
        }
        
        // Out of retries, throw error
        throw new Error(`Authentication required: ${sessionCheck.error}`);
      }
      
      // Session is valid, execute operation
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Only retry if it's a session-related error
      if (attempts < maxRetries && 
          (String(error).includes('authentication') || 
           String(error).includes('session') || 
           String(error).includes('auth'))) {
        console.log(`Operation failed with auth error (attempt ${attempts + 1}/${maxRetries + 1}):`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        attempts++;
      } else {
        // Not a session error or out of retries, rethrow
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * Custom hook for accessing session readiness state
 * A lightweight replacement for useSessionReady
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

// We need to import useState and useEffect at the top of the file
import { useState, useEffect } from 'react';
