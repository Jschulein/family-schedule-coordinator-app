
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "lucide-react";

interface SignInFormValues {
  email: string;
  password: string;
}

export function SignInForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormValues>();
  const { signIn, loading, error, resetAuthError, user, isSessionReady } = useAuth();
  const navigate = useNavigate();
  const [signInStartTime, setSignInStartTime] = useState<number | null>(null);
  const [isStalled, setIsStalled] = useState(false);

  // Monitor authentication state changes to redirect after successful login
  useEffect(() => {
    if (!loading && user && isSessionReady) {
      console.log("Authentication successful and session ready - redirecting to home");
      resetAuthError();
      navigate("/");
    }
  }, [user, loading, isSessionReady, navigate, resetAuthError]);

  // Simple check for stuck authentication attempts
  useEffect(() => {
    if (loading) {
      if (!signInStartTime) {
        setSignInStartTime(Date.now());
      }
      
      const checkTimer = setTimeout(() => {
        // If still loading after 8 seconds, consider it stalled
        if (loading && signInStartTime && (Date.now() - signInStartTime > 8000)) {
          setIsStalled(true);
          
          toast({
            title: "Still working...",
            description: "Sign-in is taking longer than expected. Please wait a moment.",
            variant: "default",
            duration: 4000,
          });
        }
      }, 8000);
      
      return () => clearTimeout(checkTimer);
    } else {
      setSignInStartTime(null);
      setIsStalled(false);
    }
  }, [loading, signInStartTime]);

  // Handle form submission
  const onSubmit = async (data: SignInFormValues) => {
    try {
      resetAuthError();
      setSignInStartTime(Date.now());
      setIsStalled(false);
      await signIn(data.email, data.password);
    } catch (err) {
      console.error("Unexpected error during sign in submission:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
            {isStalled ? "Still trying..." : "Signing in..."}
          </>
        ) : (
          "Sign In"
        )}
      </Button>
      
      {isStalled && (
        <p className="text-sm text-amber-600 mt-2">
          Sign in is taking longer than expected. Please be patient.
        </p>
      )}
    </form>
  );
}
