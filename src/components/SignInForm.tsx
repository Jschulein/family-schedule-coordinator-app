
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

  // Check for stuck authentication attempts
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
        // If still loading after 10 seconds, consider it stuck
        if (loading && authStartTime) {
          const isStalled = isAuthSessionStuck(authStartTime, 10000);
          setIsStuck(isStalled);
          
          if (isStalled) {
            toast({
              title: "Authentication Taking Too Long",
              description: "Your sign-in attempt is taking longer than expected. You may try refreshing the page or try again later.",
              variant: "destructive",
            });
          }
        }
      }, 10000);
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

  // Handle form submission
  const onSubmit = async (data: SignInFormValues) => {
    // Start auth process time tracking
    setAuthStartTime(Date.now());
    setIsStuck(false);
    await signIn(data.email, data.password);
    // Let the useEffect handle navigation after successful auth
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
            {isStuck ? "Taking longer than expected..." : "Signing in..."}
          </>
        ) : (
          "Sign In"
        )}
      </Button>
      
      {isStuck && (
        <p className="text-sm text-amber-600 mt-2">
          Sign in is taking longer than expected. You may need to refresh the page if this continues.
        </p>
      )}
    </form>
  );
}
