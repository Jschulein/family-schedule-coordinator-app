
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      console.log("Auth page: User is authenticated - redirecting to home");
      navigate("/");
    }
  }, [user, loading, navigate]);
  
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
