
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateSession } from '@/services/auth/sessionValidator';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  isSessionReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to safely refresh token if needed
  const refreshTokenIfNeeded = async (currentSession: Session | null) => {
    if (!currentSession) return null;
    
    const tokenExpirationTime = currentSession.expires_at ? currentSession.expires_at * 1000 : null;
    // If token expires in less than 5 minutes, refresh it
    if (tokenExpirationTime && Date.now() > tokenExpirationTime - 300000) {
      try {
        console.log("Token expiring soon, refreshing...");
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        return data.session;
      } catch (err) {
        console.error("Token refresh failed:", err);
        return currentSession;
      }
    }
    return currentSession;
  };

  useEffect(() => {
    // Track whether component is mounted
    let isMounted = true;
    
    const checkSessionValidity = async () => {
      try {
        // Verify that the session is valid
        const validationResult = await validateSession();
        
        if (isMounted) {
          setIsSessionReady(validationResult.valid);
          
          if (!validationResult.valid && validationResult.error && session) {
            console.warn(`Session validation failed: ${validationResult.error}`);
          }
        }
      } catch (e) {
        console.error("Error checking session validity:", e);
        if (isMounted) {
          setIsSessionReady(false);
        }
      }
    };
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        if (event) {
          console.log(`Auth event: ${event}`);
        }
        
        // Update session and user state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Reset session ready state when auth changes
        setIsSessionReady(false);
        
        // For sign-in events, verify session validity after a short delay
        if (currentSession?.user && event === 'SIGNED_IN') {
          console.log("Sign in event detected, verifying session validity...");
          
          // Short delay to allow session propagation
          setTimeout(async () => {
            if (isMounted) {
              await checkSessionValidity();
            }
          }, 500); // Increased from 300
        }
      }
    );

    // Check for existing session - with proper error handling
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            setError(error.message);
            setLoading(false);
          }
          return;
        }
        
        const currentSession = data.session;
        
        if (isMounted) {
          // Try to refresh the token if needed before setting session
          const refreshedSession = await refreshTokenIfNeeded(currentSession);
          
          setSession(refreshedSession);
          setUser(refreshedSession?.user ?? null);
          
          // Check session validity
          if (refreshedSession) {
            await checkSessionValidity();
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Unexpected error during auth initialization:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize authentication');
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Set up periodic session validation and token refresh
    const validationInterval = setInterval(async () => {
      if (session) {
        // First try to refresh token if needed
        const refreshedSession = await refreshTokenIfNeeded(session);
        if (refreshedSession !== session) {
          setSession(refreshedSession);
        }
        // Then check session validity
        checkSessionValidity();
      }
    }, 60000); // Check once per minute

    // Cleanup subscription and interval
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(validationInterval);
    };
  }, [session]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      setIsSessionReady(false);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
        return;
      }

      // No need for navigate here - we'll handle redirects in components
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      setIsSessionReady(false);
      
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
        });
        return;
      }

      toast({
        title: "Success",
        description: "Please check your email to confirm your account.",
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setIsSessionReady(false);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        toast({
          variant: "destructive",
          title: "Sign out failed",
          description: error.message,
        });
        return;
      }
      
      // We'll handle navigation after sign-out in the component that calls signOut
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetAuthError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        error,
        isSessionReady,
        signIn,
        signUp,
        signOut,
        resetAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
