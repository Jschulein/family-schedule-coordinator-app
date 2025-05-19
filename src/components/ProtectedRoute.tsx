
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionReady } from '@/hooks/auth/useSessionReady';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

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
  const [authStartTime] = useState<number>(Date.now());
  const [isStalled, setIsStalled] = useState(false);
  
  // Use our enhanced session check with debug mode enabled
  const { 
    isSessionReady, 
    isCheckingSession,
    sessionError,
    recheckSession
  } = useSessionReady({ pollInterval: 500, debugMode: true });
  
  // Consolidate loading states - we're truly ready when auth context is not loading
  // AND our session check confirms the session is properly established
  const isFullyReady = !authLoading && isSessionReady;
  const isLoading = authLoading || isCheckingSession;
  
  // Check for stalled authentication
  useEffect(() => {
    const stallCheckInterval = setInterval(() => {
      if ((authLoading || isCheckingSession) && Date.now() - authStartTime > 15000) {
        setIsStalled(true);
      }
    }, 5000);
    
    return () => clearInterval(stallCheckInterval);
  }, [authStartTime, authLoading, isCheckingSession]);
  
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
      <div className="flex flex-col h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary mb-4"></div>
        <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        
        {/* Show a message if auth check is taking too long */}
        {isStalled && (
          <div className="mt-4 max-w-md">
            <Alert>
              <AlertDescription>
                <div className="flex flex-col space-y-2">
                  <p>Authentication check is taking longer than expected.</p>
                  <button 
                    onClick={recheckSession}
                    className="flex items-center text-primary text-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Try again
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
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
