
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="space-y-4">
      {isSignUp ? <SignUpForm /> : <SignInForm />}
      <Button
        type="button"
        variant="link"
        className="w-full font-normal text-muted-foreground hover:text-primary"
        onClick={() => setIsSignUp(!isSignUp)}
      >
        {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
      </Button>
    </div>
  );
}
