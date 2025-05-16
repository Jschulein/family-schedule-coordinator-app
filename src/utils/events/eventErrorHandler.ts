
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
  
  // Check for specific recursion errors
  const errorString = String(error);
  if (errorString.includes('infinite recursion') || 
      errorString.includes('maximum stack depth exceeded')) {
    console.error('Detected recursion error in events policy. Using safe functions instead.');
    
    // Provide more detailed error info for debugging
    if (logDetails) {
      console.group('Event Policy Recursion Error');
      console.error('Error details:', error);
      console.error('Context:', context);
      console.error('Stack trace:', new Error().stack);
      console.groupEnd();
    }
  }
  
  // Use the global error handler with our context
  const errorMessage = handleError(error, {
    title: "Event Error",
    context,
    showToast: false,
    logDetails
  });
  
  // Show toast if enabled with retry functionality
  if (showToast) {
    // Create action element using our helper function
    const actionElement: ToastActionElement | undefined = retryFn 
      ? createRetryAction(retryFn)
      : undefined;
    
    toast({
      title: "Event Error",
      description: errorMessage,
      variant: "destructive",
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
