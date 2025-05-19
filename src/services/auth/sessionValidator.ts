
/**
 * Session validation service to ensure authentication is fully established
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
    
    // Verify the access token hasn't expired
    const tokenExpirationTime = session.expires_at ? session.expires_at * 1000 : null;
    if (tokenExpirationTime && Date.now() > tokenExpirationTime - 60000) { // 1 min buffer
      console.log("Token expiring soon, attempting refresh");
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        return {
          valid: false,
          error: `Token expired and refresh failed: ${refreshError.message}`,
          timestamp: Date.now()
        };
      }
    }
    
    // Check if the session is valid by making a simple user request
    // This is more reliable than RPC calls for checking auth status
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("User validation error:", userError);
      
      // If we're still within retry limits and it looks like an auth error,
      // we might be dealing with timing issues
      if (retryCount < 3 && userError.message.includes("JWT")) {
        console.log(`Session not fully established yet, retry ${retryCount + 1}/3...`);
        
        // Wait with exponential backoff
        const delay = Math.pow(2, retryCount) * 500; // Increased delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry validation
        return validateSession(retryCount + 1);
      }
      
      return {
        valid: false,
        error: `Token validation error: ${userError.message}`,
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
  maxWaitTime = 10000, // Increased from 5000
  interval = 300 // Increased from 200
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
      await waitForValidSession(5000); // Increased from 3000
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
        const delay = Math.pow(2, attempt) * 500; // Increased from 300
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Refresh token before retry
        await supabase.auth.refreshSession();
        
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
