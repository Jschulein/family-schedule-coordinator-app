
import { toast } from "@/hooks/use-toast";
import { ToastActionElement } from "@/components/ui/toast";
import { logEventFlow } from "./eventFlow";
import { handleError } from "@/utils/error";
import { createRetryAction } from "@/components/ui/toast-helpers";

type EventErrorOptions = {
  context: string;
  showToast?: boolean;
  retryFn?: () => void;
  logDetails?: boolean;
}

/**
 * Specialized error handler for event-related operations
 * @param error The error that occurred
 * @param options Configuration options for error handling
 * @returns Formatted error message
 */
export function handleEventError(error: unknown, options: EventErrorOptions): string {
  const { context, showToast = true, retryFn, logDetails = true } = options;
  
  // Log the error with event flow context
  logEventFlow(context, 'Error occurred', error);
  
  // Extract the error string for pattern matching
  const errorString = String(error);
  
  // Handle specific error types
  let errorMessage = '';
  let severity: 'error' | 'warning' = 'error';
  let isRecoverable = false;
  
  // Check for specific recursion errors
  if (errorString.includes('infinite recursion') || 
      errorString.includes('maximum stack depth exceeded')) {
    console.error('Detected recursion error in events policy. Using safe functions instead.');
    errorMessage = 'A database security policy issue occurred. Try again in a moment.';
    severity = 'warning';
    isRecoverable = true;
    
    // Provide more detailed error info for debugging
    if (logDetails) {
      console.group('Event Policy Recursion Error');
      console.error('Error details:', error);
      console.error('Context:', context);
      console.error('Stack trace:', new Error().stack);
      console.groupEnd();
    }
  }
  // Check for RPC function not found errors
  else if (errorString.includes('function') && errorString.includes('does not exist')) {
    console.error('Database function not found error. The migration may not have been applied correctly.');
    errorMessage = 'A system configuration issue occurred. Please try again later or contact support.';
    severity = 'error';
    isRecoverable = false;
    
    if (logDetails) {
      console.group('Database Function Error');
      console.error('Error details:', error);
      console.error('Context:', context);
      console.error('Required function may not be deployed yet. Check migrations.');
      console.groupEnd();
    }
  }
  // Check for connection errors
  else if (errorString.includes('network') || errorString.includes('connection')) {
    errorMessage = 'Network connection issue. Please check your internet connection and try again.';
    severity = 'warning';
    isRecoverable = true;
  }
  // Check for permission errors
  else if (errorString.includes('permission') || errorString.includes('not allowed')) {
    errorMessage = 'You don\'t have permission to perform this action.';
    severity = 'error';
    isRecoverable = false;
  }
  
  // If we didn't identify a specific error type, use the global error handler
  if (!errorMessage) {
    errorMessage = handleError(error, {
      title: "Event Error",
      context,
      showToast: false,
      logDetails
    });
  } else if (logDetails) {
    // If we did identify the error but still want standard logging
    handleError(error, {
      title: "Event Error",
      context,
      showToast: false,
      logDetails: false // No need to log again
    });
  }
  
  // Show toast if enabled with retry functionality for recoverable errors
  if (showToast) {
    // Create action element using our helper function
    const actionElement: ToastActionElement | undefined = (retryFn && isRecoverable)
      ? createRetryAction(retryFn)
      : undefined;
    
    toast({
      title: severity === 'error' ? "Event Error" : "Event Warning",
      description: errorMessage,
      variant: severity === 'error' ? "destructive" : "default",
      action: actionElement,
    });
  }
  
  return errorMessage;
}

/**
 * Creates a wrapped function with event error handling
 * @param fn Function to wrap with error handling
 * @param options Error handling options
 * @returns Wrapped function with error handling
 */
export function withEventErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: EventErrorOptions
): (...args: Args) => Promise<T | null> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleEventError(error, options);
      return null;
    }
  };
}
