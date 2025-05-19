
/**
 * Hook to track whether the authentication session is fully established
 * Simplified to reduce complexity and avoid circular validation
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseSessionReadyOptions {
  debugMode?: boolean;
  pollInterval?: number; // Added pollInterval option for periodic session checking
}

export function useSessionReady(options: UseSessionReadyOptions = {}) {
  const { debugMode = false, pollInterval = 0 } = options;
  
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Check if the session is ready with minimal complexity
  const checkSession = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      if (debugMode) {
        console.log("Checking session readiness...");
      }
      
      // Get current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!session) {
        setIsReady(false);
        setUserId(null);
        setError("No active session found");
        setIsChecking(false);
        return;
      }
      
      // Simple validity check - just see if we have a valid user
      // This avoids making additional API calls that might create loops
      if (session.user?.id) {
        setIsReady(true);
        setUserId(session.user.id);
        
        if (debugMode) {
          console.log('Session validation successful, user ID:', session.user.id);
        }
      } else {
        setIsReady(false);
        setError("Invalid session user data");
        
        if (debugMode) {
          console.warn("Session has no valid user data");
        }
      }
    } catch (e: any) {
      if (debugMode) {
        console.error("Session validation error:", e);
      }
      
      setIsReady(false);
      setError(e.message || "Session validation failed");
    } finally {
      setIsChecking(false);
    }
  }, [debugMode]);
  
  // Effect to check session on auth state changes
  useEffect(() => {
    // Initial check
    checkSession();
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (debugMode) {
          console.log(`Auth state changed: ${event}, session user: ${newSession?.user?.id || 'none'}`);
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await checkSession();
        } else if (event === 'SIGNED_OUT') {
          setIsReady(false);
          setIsChecking(false);
          setUserId(null);
          setError(null);
        }
      }
    );
    
    // Set up polling if interval is provided
    let pollTimer: number | undefined;
    if (pollInterval > 0) {
      pollTimer = window.setInterval(() => {
        if (!isReady) {
          checkSession();
        }
      }, pollInterval);
    }
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [checkSession, debugMode, pollInterval, isReady]);
  
  return {
    isSessionReady: isReady,
    isCheckingSession: isChecking,
    sessionError: error,
    userId,
    recheckSession: checkSession
  };
}
