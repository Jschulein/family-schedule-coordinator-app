
/**
 * Hook to track whether the authentication session is fully established
 * Helps prevent operations before authentication is ready at both client and server
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseSessionReadyOptions {
  pollInterval?: number;
  maxWaitTime?: number;
  debugMode?: boolean;
}

export function useSessionReady(options: UseSessionReadyOptions = {}) {
  const { pollInterval = 0, maxWaitTime = 20000, debugMode = false } = options;
  
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkAttempts, setCheckAttempts] = useState<number>(0);
  
  // Check if the session is ready with retry logic and backoff
  const checkSession = useCallback(async (attempt = 0) => {
    setIsChecking(true);
    setError(null);
    
    try {
      if (debugMode) {
        console.log(`Checking session readiness (attempt ${attempt + 1})...`);
      }
      
      // Get current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!session) {
        setIsReady(false);
        setError("No active session found");
        setIsChecking(false);
        return;
      }
      
      // Verify access token hasn't expired
      const tokenExpirationTime = session.expires_at ? session.expires_at * 1000 : null;
      if (tokenExpirationTime && Date.now() > tokenExpirationTime - 60000) { // 1 min buffer
        if (debugMode) {
          console.log("Token expiring soon, refreshing");
        }
        
        // Refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw refreshError;
        }
      }
      
      // Make a simple authenticated request to verify the session
      // Use user() instead of complex RPC calls
      const { error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        if (debugMode) {
          console.warn("Session validation failed:", userError.message);
        }
        
        // If we're still within retry limits and it looks like an auth error,
        // we might be dealing with timing issues
        if (attempt < 3) {
          if (debugMode) {
            console.log(`Session not fully established yet, retry ${attempt + 1}/3...`);
          }
          
          // Wait with exponential backoff
          const delay = Math.pow(2, attempt) * 300;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry validation
          return checkSession(attempt + 1);
        }
        
        setError(userError.message);
        setIsReady(false);
      } else {
        // Session is valid
        setIsReady(true);
        setUserId(session.user.id);
        
        if (debugMode) {
          console.log('Session validation successful, user ID:', session.user.id);
        }
      }
    } catch (e: any) {
      if (debugMode) {
        console.error("Session validation error:", e);
      }
      
      setIsReady(false);
      setError(e.message || "Session validation failed");
      
      // Attempt retry for auth errors if within limit
      if (attempt < 3) {
        const delay = Math.pow(2, attempt) * 300;
        await new Promise(resolve => setTimeout(resolve, delay));
        return checkSession(attempt + 1);
      }
    } finally {
      setIsChecking(false);
      setCheckAttempts(prev => prev + 1);
    }
  }, [debugMode]);
  
  // Re-check session on auth state changes
  useEffect(() => {
    // Initial check
    checkSession();
    
    // Track auth timeout
    const startTime = Date.now();
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (debugMode) {
          console.log(`Auth state changed: ${event}, session user: ${newSession?.user?.id || 'none'}`);
        }
        
        if (event === 'SIGNED_IN') {
          // On sign in, we wait a moment for the session to be fully established
          setIsChecking(true);
          setIsReady(false);
          
          // Short delay to allow session to propagate
          setTimeout(() => {
            checkSession();
          }, 300);
        } else if (event === 'SIGNED_OUT') {
          setIsReady(false);
          setIsChecking(false);
          setUserId(null);
          setError(null);
        } else if (['TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
          // For token refresh events, verify session validity
          checkSession();
        }
      }
    );
    
    // Optional polling for session readiness
    let interval: number | undefined;
    if (pollInterval > 0) {
      interval = window.setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        
        // Stop polling after maxWaitTime
        if (elapsedTime > maxWaitTime) {
          if (interval) {
            clearInterval(interval);
          }
          return;
        }
        
        if (!isReady && !isChecking) {
          checkSession();
        }
      }, pollInterval);
    }
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [checkSession, isReady, isChecking, pollInterval, maxWaitTime, debugMode]);
  
  return {
    isSessionReady: isReady,
    isCheckingSession: isChecking,
    sessionError: error,
    userId,
    checkAttempts,
    recheckSession: () => checkSession(0)
  };
}
