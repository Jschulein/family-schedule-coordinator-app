
/**
 * Authentication-specific error handling utilities
 */
import { toast } from "@/components/ui/use-toast";

type AuthErrorOptions = {
  showToast?: boolean;
  redirectTo?: string | null;
};

/**
 * Formats authentication errors into user-friendly messages
 * @param error The raw error message or object
 * @returns A user-friendly formatted error message
 */
export function formatAuthError(error: any): string {
  if (!error) return '';
  
  const errorMessage = typeof error === 'string' ? error : error.message || 'Unknown authentication error';
  
  // Map common authentication errors to user-friendly messages
  if (errorMessage.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  } else if (errorMessage.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in.';
  } else if (errorMessage.includes('rate limit')) {
    return 'Too many login attempts. Please try again later.';
  } else if (errorMessage.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Return the original message if no specific mapping is found
  return errorMessage;
}

/**
 * Handles authentication errors consistently
 * @param error The auth error object or message string
 * @param options Configuration options for handling the error
 * @returns The formatted error message
 */
export function handleAuthError(error: any, options: AuthErrorOptions = {}): string {
  const { showToast = true } = options;
  
  // Format the error message
  const formattedMessage = formatAuthError(error);
  
  // Show toast notification if enabled
  if (showToast && formattedMessage) {
    toast({
      title: "Authentication Error",
      description: formattedMessage,
      variant: "destructive",
      duration: 5000
    });
  }
  
  return formattedMessage;
}

/**
 * Detects if an authentication session is likely stuck
 * @param startTime The time when auth process started
 * @param maxWaitTime Maximum acceptable wait time in ms
 * @returns True if the session appears to be stuck
 */
export function isAuthSessionStuck(startTime: number, maxWaitTime = 10000): boolean {
  return Date.now() - startTime > maxWaitTime;
}
