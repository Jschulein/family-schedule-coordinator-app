
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) => {
  const { user, loading, isSessionReady } = useAuth();
  const location = useLocation();
  const [authStartTime] = useState<number>(Date.now());
  const [isStalled, setIsStalled] = useState(false);
  
  // Check for stalled authentication
  useEffect(() => {
    const stallCheckInterval = setInterval(() => {
      if (loading && Date.now() - authStartTime > 10000) {
        setIsStalled(true);
      }
    }, 5000);
    
    return () => clearInterval(stallCheckInterval);
  }, [authStartTime, loading]);
  
  // Log for debugging purposes
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log(`Access to protected route ${location.pathname} blocked - redirecting to ${redirectTo}`);
      } else if (!isSessionReady) {
        console.log(`User authenticated but session not fully established for ${location.pathname}`);
      }
    }
  }, [loading, user, isSessionReady, location.pathname, redirectTo]);

  if (loading) {
    // Show a loading state while we check authentication
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary mb-4"></div>
        <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        
        {isStalled && (
          <div className="mt-4 max-w-md">
            <Alert>
              <AlertDescription>
                <div className="flex flex-col space-y-2">
                  <p>Authentication check is taking longer than expected.</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex items-center text-primary text-sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh page
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    );
  }

  // If user is not authenticated, redirect to login page
  if (!user || !isSessionReady) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If user is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
