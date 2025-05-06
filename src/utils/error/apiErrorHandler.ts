
import { PostgrestError, AuthError } from "@supabase/supabase-js";
import { handleError } from "./errorHandler";

interface ApiErrorOptions {
  context?: string;
  showToast?: boolean;
  logDetails?: boolean;
  title?: string;
}

/**
 * Handles Supabase API errors consistently
 * @param error The Supabase error object
 * @param options Error handling options
 * @returns Formatted error message
 */
export function handleApiError(
  error: PostgrestError | AuthError | null | undefined,
  options: ApiErrorOptions = {}
): string | null {
  if (!error) return null;
  
  // Extract relevant information from the error
  const errorInfo = {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: (error as PostgrestError).hint
  };
  
  // Handle specific error types
  let displayMessage: string;
  
  if (isAuthError(error)) {
    displayMessage = formatAuthError(error as AuthError);
  } else if (isDatabaseError(error)) {
    displayMessage = formatDatabaseError(error as PostgrestError);
  } else {
    displayMessage = error.message || "An unknown error occurred";
  }
  
  // Use the generic error handler with the formatted message
  return handleError(displayMessage, {
    context: options.context,
    showToast: options.showToast,
    logDetails: options.logDetails,
    title: options.title || getErrorTitle(error)
  });
}

/**
 * Determines if an error is an authentication error
 */
function isAuthError(error: any): boolean {
  return error.name === "AuthError" || error.code?.startsWith("auth/");
}

/**
 * Determines if an error is a database error
 */
function isDatabaseError(error: any): boolean {
  return error.code?.match(/^[0-9]+$/) !== null || // PostgreSQL error codes are numeric
         error.code?.startsWith("PGRST");  // PostgREST error codes start with PGRST
}

/**
 * Formats authentication errors into user-friendly messages
 */
function formatAuthError(error: AuthError): string {
  switch (error.message) {
    case "Invalid login credentials":
      return "Incorrect email or password. Please try again.";
    case "Email not confirmed":
      return "Please check your email and confirm your account before signing in.";
    default:
      return error.message;
  }
}

/**
 * Gets an appropriate title for the error based on its type
 */
function getErrorTitle(error: any): string {
  if (isAuthError(error)) {
    return "Authentication Error";
  } else if (isDatabaseError(error)) {
    return "Database Error";
  } else {
    return "Error";
  }
}

/**
 * Import database error formatter from the existing file
 */
import { formatDatabaseError } from "./databaseErrorHandler";
