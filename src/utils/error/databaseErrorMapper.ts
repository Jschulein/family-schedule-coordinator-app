
/**
 * Database-specific error mapping utility
 * Maps database error codes to user-friendly messages and actions
 */
import { toast } from "@/components/ui/use-toast";
import { PostgrestError } from "@supabase/supabase-js";

type DatabaseErrorCode = string;

interface ErrorDefinition {
  message: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
  recoverable: boolean;
}

/**
 * Maps known database error codes to user-friendly messages
 */
const ERROR_MAP: Record<DatabaseErrorCode, ErrorDefinition> = {
  '23505': {
    message: 'This record already exists.',
    action: 'Try with different information or check if it was already created.',
    severity: 'warning',
    recoverable: true
  },
  '23503': {
    message: 'This action references data that doesn\'t exist.',
    action: 'Check that all required information exists first.',
    severity: 'error',
    recoverable: false
  },
  '42P01': {
    message: 'The requested data structure doesn\'t exist.',
    action: 'Please contact support.',
    severity: 'error',
    recoverable: false
  },
  '42501': {
    message: 'You don\'t have permission to perform this action.',
    action: 'Check your access level or contact an administrator.',
    severity: 'error',
    recoverable: false
  },
  '42P17': {
    message: 'There was a problem with the database security policy.',
    action: 'Please try again or contact support if the problem persists.',
    severity: 'warning',
    recoverable: true
  }
};

/**
 * Handles database errors with appropriate user feedback
 * @param error The database error
 * @param context Optional context for better error messages
 * @param showToast Whether to show a toast notification
 * @returns User-friendly error message
 */
export function handleDatabaseError(
  error: PostgrestError | null | undefined | any,
  context: string = 'operation',
  showToast: boolean = true
): string {
  if (!error) {
    return '';
  }

  let errorCode: string = '';
  let errorMessage: string = 'An unexpected database error occurred.';
  let errorAction: string | undefined = undefined;
  let severity: 'error' | 'warning' | 'info' = 'error';

  // Extract error code and message
  if (typeof error === 'object') {
    errorCode = error.code || '';
    
    // Try to get the specific mapped error
    const mappedError = ERROR_MAP[errorCode];
    
    if (mappedError) {
      errorMessage = mappedError.message;
      errorAction = mappedError.action;
      severity = mappedError.severity;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Special case for infinite recursion errors
    if (error.message && error.message.includes('infinite recursion')) {
      errorMessage = 'The database security policy encountered a recursive issue.';
      errorAction = 'Please try again in a moment or contact support.';
      severity = 'warning';
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  // Build complete message with context
  const fullMessage = `${context}: ${errorMessage}`;
  
  // Show toast if enabled
  if (showToast) {
    toast({
      title: severity === 'error' ? 'Error' : (severity === 'warning' ? 'Warning' : 'Notice'),
      description: fullMessage + (errorAction ? ` ${errorAction}` : ''),
      variant: severity === 'error' ? 'destructive' : (severity === 'warning' ? 'default' : 'secondary')
    });
  }
  
  // Log detailed error information for debugging
  console.error(`Database ${severity} in ${context}:`, {
    code: errorCode,
    message: errorMessage,
    originalError: error
  });
  
  return fullMessage;
}

/**
 * Checks if an error is recoverable based on its code
 * @param error The database error
 * @returns True if the error is recoverable, false otherwise
 */
export function isRecoverableError(error: PostgrestError | null | undefined | any): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  const errorCode = error.code || '';
  const mappedError = ERROR_MAP[errorCode];
  
  // Consider specific errors as recoverable
  if (mappedError) {
    return mappedError.recoverable;
  }
  
  // Infinite recursion errors can usually be retried
  if (error.message && error.message.includes('infinite recursion')) {
    return true;
  }
  
  return false;
}
