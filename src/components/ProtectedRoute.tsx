
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionReady } from '@/hooks/auth/useSessionReady';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  
  // Use our enhanced session check to verify authentication is fully established
  const { 
    isSessionReady, 
    isCheckingSession,
    sessionError
  } = useSessionReady({ pollInterval: 500 });
  
  // Consolidate loading states - we're truly ready when auth context is not loading
  // AND our session check confirms the session is properly established
  const isFullyReady = !authLoading && isSessionReady;
  const isLoading = authLoading || isCheckingSession;
  
  useEffect(() => {
    // Log for debugging purposes
    if (!isLoading) {
      if (!user) {
        console.log(`Access to protected route ${location.pathname} blocked - redirecting to ${redirectTo}`);
      } else if (!isSessionReady) {
        console.log(`User authenticated locally but session not fully established at server for ${location.pathname}`);
      }
    }
  }, [isLoading, user, isSessionReady, location.pathname, redirectTo]);
  
  useEffect(() => {
    // Log session errors for debugging
    if (sessionError && user) {
      console.warn(`Session validation error despite authenticated user: ${sessionError}`);
    }
  }, [sessionError, user]);

  if (isLoading) {
    // Show a loading state while we check authentication
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated or session is not ready, redirect to login page
  if (!user || !isSessionReady) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If user is authenticated and session is fully established, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
