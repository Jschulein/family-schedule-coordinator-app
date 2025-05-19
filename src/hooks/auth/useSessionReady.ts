
/**
 * Hook to track whether the authentication session is fully established
 * Helps prevent operations before authentication is ready at both client and server
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { validateSession } from '@/services/auth/sessionValidator';

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
      
      const result = await validateSession(attempt);
      
      if (result.valid) {
        if (debugMode) {
          console.log('Session validation successful:', result);
        }
        setIsReady(true);
        setUserId(result.userId || null);
      } else {
        setIsReady(false);
        
        // Only set error if this was the final attempt or if we have a critical error
        if (attempt >= 2 || result.error?.includes('critical')) {
          setError(result.error || "Session validation failed");
          if (debugMode) {
            console.warn('Session validation failed:', result.error);
          }
        } else if (debugMode) {
          console.log(`Session not ready yet (attempt ${attempt + 1}): ${result.error}`);
        }
        
        // Implement exponential backoff for retries
        if (attempt < 3) {
          const backoffDelay = Math.min(Math.pow(2, attempt) * 300, 2000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          return checkSession(attempt + 1);
        }
      }
    } catch (e: any) {
      setIsReady(false);
      setError(e.message || "Session validation failed");
      if (debugMode) {
        console.error("Session validation error:", e);
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
          // On sign in, we want to wait a moment for the session to be fully established
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
