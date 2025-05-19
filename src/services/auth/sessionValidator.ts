
/**
 * Session validation service to ensure authentication is fully established
 * Addresses the race condition between client-side auth state and Supabase session
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
 * @param retryCount Number of validation attempts already made
 * @returns Session validation result
 */
export async function validateSession(retryCount = 0): Promise<SessionValidationResult> {
  try {
    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Session validation error:", error);
      return {
        valid: false,
        error: `Session validation error: ${error.message}`,
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
    
    // Check if the token is valid by making a lightweight RPC call
    // This verifies that the session is fully established at the Supabase level
    const { data: isAuthenticated, error: rpcError } = await supabase.rpc(
      'function_exists',
      { function_name: 'get_user_events_safe' }
    );
    
    if (rpcError) {
      console.error("Token validation error:", rpcError);
      
      // If we're still within retry limits and it looks like an auth error,
      // we might be dealing with timing issues
      if (retryCount < 3 && rpcError.message.includes("JWT")) {
        console.log(`Session not fully established yet, retry ${retryCount + 1}/3...`);
        
        // Wait with exponential backoff
        const delay = Math.pow(2, retryCount) * 200;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry validation
        return validateSession(retryCount + 1);
      }
      
      return {
        valid: false,
        error: `Token validation error: ${rpcError.message}`,
        timestamp: Date.now()
      };
    }
    
    // Return successful validation with user ID
    return {
      valid: true,
      userId: session.user.id,
      timestamp: Date.now()
    };
  } catch (e: any) {
    console.error("Unexpected error during session validation:", e);
    return {
      valid: false,
      error: `Unexpected validation error: ${e.message}`,
      timestamp: Date.now()
    };
  }
}

/**
 * Waits for a valid session to be established
 * @param maxWaitTime Maximum time to wait in milliseconds
 * @param interval Check interval in milliseconds
 * @returns Promise that resolves when session is valid or rejects after timeout
 */
export async function waitForValidSession(
  maxWaitTime = 5000,
  interval = 200
): Promise<SessionValidationResult> {
  const startTime = Date.now();
  
  // First immediate check
  const initialCheck = await validateSession();
  if (initialCheck.valid) {
    return initialCheck;
  }
  
  return new Promise((resolve, reject) => {
    const checkSession = async () => {
      const result = await validateSession();
      
      if (result.valid) {
        resolve(result);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed >= maxWaitTime) {
        reject(new Error(`Session validation timed out after ${maxWaitTime}ms: ${result.error}`));
        return;
      }
      
      setTimeout(checkSession, interval);
    };
    
    setTimeout(checkSession, interval);
  });
}

/**
 * Utility to safely execute operations that require authentication
 * Ensures the session is valid before proceeding and handles retry logic
 * @param operation Function to execute once session is validated
 * @param maxRetries Maximum number of operation retries on auth errors
 * @returns Result of the operation
 */
export async function withValidSession<T>(
  operation: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  // First validate the session
  const validation = await validateSession();
  
  if (!validation.valid) {
    // Try waiting for a valid session if initial validation failed
    try {
      await waitForValidSession(3000);
    } catch (e: any) {
      throw new Error(`Cannot proceed - authentication not established: ${validation.error}`);
    }
  }
  
  // Execute the operation with retry logic
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if this is an authentication error that might be due to timing
      const isAuthError = 
        error.message?.includes?.("not authorized") ||
        error.message?.includes?.("JW") ||
        error.message?.includes?.("permission") ||
        error.message?.includes?.("policy");
      
      if (isAuthError && attempt < maxRetries) {
        console.log(`Operation failed with auth error, retry ${attempt + 1}/${maxRetries}`);
        
        // Wait with exponential backoff
        const delay = Math.pow(2, attempt) * 300;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Re-validate session before retry
        await validateSession();
        continue;
      }
      
      // Either not an auth error or we're out of retries
      throw error;
    }
  }
  
  // This should never happen, but TypeScript needs it
  throw lastError;
}
