
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const { user, loading, isSessionReady } = useAuth();
  const navigate = useNavigate();
  const [authStartTime] = useState<number>(Date.now());
  const [isStalled, setIsStalled] = useState(false);
  
  // Simple check for stalled authentication
  useEffect(() => {
    const stallCheckInterval = setInterval(() => {
      if (loading && Date.now() - authStartTime > 15000) {
        setIsStalled(true);
      }
    }, 5000);
    
    return () => clearInterval(stallCheckInterval);
  }, [authStartTime, loading]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && isSessionReady) {
      console.log("Auth page: User is authenticated and session is ready - redirecting to home");
      navigate("/");
    }
  }, [user, loading, isSessionReady, navigate]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Family Schedule</CardTitle>
            <CardDescription className="text-center">
              Sign in to manage your family events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col justify-center items-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary mb-3"></div>
                <span className="text-sm text-muted-foreground">Checking authentication status...</span>
                
                {isStalled && (
                  <Alert variant="default" className="mt-4 border-yellow-300 bg-yellow-50">
                    <AlertDescription>
                      Authentication check is taking longer than expected. If this persists, please refresh the page.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <AuthForm />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
