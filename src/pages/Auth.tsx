
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Simple login flow - just store the email in session
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: email, // Using email as password for now
        });
        
        if (error) {
          // If user doesn't exist, show error
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Account not found",
              description: "Please sign up first or check your email"
            });
            return;
          }
          throw error;
        }

        toast({
          title: "Welcome back!",
          description: "Successfully logged in"
        });
        navigate("/");
      } else {
        // Sign-up flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password: email, // Using email as password for now
          options: {
            data: { full_name: fullName }
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "You can now log in with your email"
        });
        setIsLogin(true); // Switch to login view after successful signup
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isLogin ? "Welcome Back" : "Join Family Schedule"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Log in to access your family schedule" 
              : "Sign up with your email to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {isLogin ? "Send Login Link" : "Send Sign Up Link"}
            </Button>
            <div className="text-center">
              <Button 
                type="button" 
                variant="link" 
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin 
                  ? "Need an account? Sign Up" 
                  : "Already have an account? Log In"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
