
/**
 * Hook to track whether the authentication session is fully established
 * Helps prevent operations before authentication is ready at both client and server
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { validateSession } from '@/services/auth/sessionValidator';

export function useSessionReady(options = { pollInterval: 0 }) {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Check if the session is ready
  const checkSession = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const result = await validateSession();
      
      if (result.valid) {
        setIsReady(true);
        setUserId(result.userId || null);
      } else {
        setIsReady(false);
        setError(result.error || "Unknown validation error");
      }
    } catch (e: any) {
      setIsReady(false);
      setError(e.message || "Session validation failed");
    } finally {
      setIsChecking(false);
    }
  }, []);
  
  // Re-check session on auth state changes
  useEffect(() => {
    // Initial check
    checkSession();
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log(`Auth state changed: ${event}, rechecking session...`);
        
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
        } else {
          // For other events, just check normally
          checkSession();
        }
      }
    );
    
    // Optional polling for session readiness
    let interval: number | undefined;
    if (options.pollInterval > 0 && !isReady) {
      interval = window.setInterval(() => {
        if (!isReady) {
          checkSession();
        } else if (interval) {
          clearInterval(interval);
        }
      }, options.pollInterval);
    }
    
    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [checkSession, isReady, options.pollInterval]);
  
  return {
    isSessionReady: isReady,
    isCheckingSession: isChecking,
    sessionError: error,
    userId,
    recheckSession: checkSession
  };
}
