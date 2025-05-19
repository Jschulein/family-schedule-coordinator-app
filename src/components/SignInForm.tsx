
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Loader } from "lucide-react";
import { isAuthSessionStuck } from "@/utils/error/authErrorHandler";

interface SignInFormValues {
  email: string;
  password: string;
}

export function SignInForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormValues>();
  const { signIn, loading, error, resetAuthError, user, isSessionReady } = useAuth();
  const navigate = useNavigate();
  const [authStartTime, setAuthStartTime] = useState<number | null>(null);
  const [isStuck, setIsStuck] = useState(false);

  // Monitor authentication state changes to redirect after successful login
  useEffect(() => {
    // Only redirect when authentication is complete and valid
    if (!loading && user && isSessionReady) {
      console.log("Auth successful and session ready - redirecting to home");
      // Clear any previous error
      resetAuthError();
      // Navigate to home page
      navigate("/");
    }
  }, [user, loading, isSessionReady, navigate, resetAuthError]);

  // Check for stuck authentication attempts with more generous timeout
  useEffect(() => {
    if (loading && !authStartTime) {
      // Set the start time when loading begins
      setAuthStartTime(Date.now());
    } else if (!loading) {
      // Reset when loading stops
      setAuthStartTime(null);
      setIsStuck(false);
    }

    // Check if auth might be stuck after a reasonable timeout
    let checkTimer: number | undefined;
    if (authStartTime) {
      checkTimer = window.setTimeout(() => {
        // If still loading after 15 seconds (increased from 10), consider it stuck
        if (loading && authStartTime) {
          const isStalled = isAuthSessionStuck(authStartTime, 15000);
          setIsStuck(isStalled);
          
          if (isStalled) {
            toast({
              title: "Authentication Taking Longer Than Expected",
              description: "Your sign-in attempt is taking longer than expected. The system is still trying to authenticate. Please wait a moment longer.",
              variant: "default",
              duration: 8000,
            });
          }
        }
      }, 15000); // Increased from 10000
    }

    return () => {
      if (checkTimer) clearTimeout(checkTimer);
    };
  }, [loading, authStartTime]);

  // Show error messages in toast
  useEffect(() => {
    if (error && !loading) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, loading]);

  // Handle form submission with improved error handling
  const onSubmit = async (data: SignInFormValues) => {
    try {
      // Reset any previous errors
      resetAuthError();
      // Start auth process time tracking
      setAuthStartTime(Date.now());
      setIsStuck(false);
      // Attempt sign in
      await signIn(data.email, data.password);
      // Let the useEffect handle navigation after successful auth
    } catch (err) {
      // This shouldn't happen as errors are handled in the signIn function
      console.error("Unexpected error during sign in submission:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            {isStuck ? "Still trying..." : "Signing in..."}
          </>
        ) : (
          "Sign In"
        )}
      </Button>
      
      {isStuck && (
        <p className="text-sm text-amber-600 mt-2">
          Sign in is taking longer than expected. Please be patient while the system completes authentication.
        </p>
      )}
    </form>
  );
}
