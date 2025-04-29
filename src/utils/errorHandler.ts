
import { toast } from "@/components/ui/use-toast";

type ErrorOptions = {
  title?: string;
  showToast?: boolean;
  context?: string;
};

/**
 * Handles errors consistently across the application
 * @param error The error object or message string
 * @param options Configuration options for handling the error
 * @returns The formatted error message
 */
export function handleError(error: unknown, options: ErrorOptions = {}): string {
  const { 
    title = "Error", 
    showToast = true,
    context = ''
  } = options;
  
  // Extract error message based on error type
  let message: string;
  
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String((error as { message: unknown }).message);
  } else {
    message = "An unknown error occurred";
  }
  
  // Add context to the message if provided
  const displayMessage = context ? `${context}: ${message}` : message;
  
  // Log the error to console with context
  console.error(
    `Error${context ? ` [${context}]` : ''}:`,
    error
  );
  
  // Show toast notification if enabled
  if (showToast) {
    toast({
      title,
      description: displayMessage,
      variant: "destructive"
    });
  }
  
  return displayMessage;
}

/**
 * Wraps an async function with consistent error handling
 * @param fn The async function to wrap
 * @param options Error handling options
 * @returns A new function with built-in error handling
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: ErrorOptions = {}
): (...args: Args) => Promise<T | null> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      return null;
    }
  };
}
