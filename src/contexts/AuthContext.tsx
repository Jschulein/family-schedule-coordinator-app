
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateSession } from '@/services/auth/authUtils';

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
  validateAuthSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize auth and set up listener for auth state changes
  useEffect(() => {
    // Track whether component is mounted
    let isMounted = true;
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        console.log(`Auth event: ${event}`);
        
        // Update session and user state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // For sign-in events, verify session validity
        if (currentSession?.user) {
          try {
            const validationResult = await validateSession();
            if (isMounted) {
              setIsSessionReady(validationResult.valid);
              
              if (!validationResult.valid && validationResult.error) {
                console.warn(`Session validation issue: ${validationResult.error}`);
              }
            }
          } catch (err) {
            console.error("Error validating session:", err);
            if (isMounted) {
              setIsSessionReady(false);
            }
          }
        } else {
          setIsSessionReady(false);
        }
        
        // Ensure we clear loading state
        setLoading(false);
      }
    );

    // Check for existing session
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
        
        if (isMounted) {
          const currentSession = data.session;
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          // Check session validity if we have one
          if (currentSession?.user) {
            try {
              const validationResult = await validateSession();
              setIsSessionReady(validationResult.valid);
            } catch (err) {
              console.error("Error validating initial session:", err);
              setIsSessionReady(false);
            }
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
    
    // Cleanup function
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Validates the current authentication session directly
   * @returns Promise resolving to a boolean indicating if session is valid
   */
  const validateAuthSession = async (): Promise<boolean> => {
    try {
      const result = await validateSession();
      return result.valid;
    } catch (err) {
      console.error("Error in validateAuthSession:", err);
      return false;
    }
  };

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

      // Auth state change listener will handle the rest
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
      
      // Auth state listener will handle updating the state
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
        resetAuthError,
        validateAuthSession
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
