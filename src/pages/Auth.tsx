
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";

const Auth = () => {
  const { user, loading, isSessionReady } = useAuth();
  const navigate = useNavigate();
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // Check authentication status and redirect if already logged in
  useEffect(() => {
    // Only redirect when we have a valid session that's fully established
    if (!loading && user && isSessionReady) {
      navigate("/");
    }
    
    // Mark auth check as complete after initial loading
    if (!loading) {
      setAuthCheckComplete(true);
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
            {loading && !authCheckComplete ? (
              <div className="flex justify-center items-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                <span className="ml-3 text-sm text-muted-foreground">Checking authentication status...</span>
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
