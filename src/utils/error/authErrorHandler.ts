
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
  } else if (errorMessage.includes('session')) {
    if (errorMessage.includes('expired')) {
      return 'Your session has expired. Please sign in again.';
    }
    if (errorMessage.includes('not found') || errorMessage.includes('invalid')) {
      return 'Authentication session issue. Please sign in again.';
    }
  }
  
  // Return the original message if no specific mapping is found
  return errorMessage;
}

/**
 * Simplified handler for auth errors
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
 * Checks if the error might be due to a network connectivity issue
 */
export function isNetworkAuthError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  return errorMessage.includes('network') || 
         errorMessage.includes('connection') || 
         errorMessage.includes('offline') ||
         errorMessage.includes('timeout');
}

/**
 * Checks if the error might be due to a session token issue
 */
export function isTokenError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  return errorMessage.includes('token') || 
         errorMessage.includes('JWT') ||
         errorMessage.includes('expired') ||
         errorMessage.includes('session');
}
