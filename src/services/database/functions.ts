
/**
 * Database function utilities with improved error handling
 */
import { supabase } from "@/integrations/supabase/client";
import { DatabaseResponse, formatError } from "./types";
import { performanceTracker } from "@/utils/testing";

interface CallFunctionOptions {
  retryCount?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Executes an RPC function with improved error handling and retry capability
 * @param functionName Name of the function to call
 * @param params Parameters to pass to the function
 * @param options Options for function execution
 * @returns Result of the function call
 */
export async function callFunction<T = any>(
  functionName: string,
  params?: Record<string, any>,
  options: CallFunctionOptions = {}
): Promise<DatabaseResponse<T>> {
  const { 
    retryCount = 0, 
    maxRetries = 2, 
    retryDelay = 1000 
  } = options;
  
  // Track performance
  const trackingId = performanceTracker.startMeasure(`callFunction:${functionName}`);
  
  try {
    console.log(`Calling function ${functionName} (attempt ${retryCount + 1})`, params);
    
    // Use a direct 'any' type assertion to completely bypass TypeScript errors
    const { data, error, status } = await (supabase.rpc as any)(functionName, params);
    
    if (error) {
      console.error(`Error calling function ${functionName}:`, error);
      
      // Check if this is a recoverable error and we should retry
      if (retryCount < maxRetries && isRecoverableError(error)) {
        console.log(`Retrying function ${functionName} in ${retryDelay}ms...`);
        
        // Implement exponential backoff
        const nextDelay = retryDelay * 2;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Retry with incrementing retry count
        return callFunction(functionName, params, {
          retryCount: retryCount + 1,
          maxRetries,
          retryDelay: nextDelay
        });
      }
      
      const formattedError = formatError(error);
      return {
        data: null,
        error: formattedError.message,
        status: formattedError.status
      };
    }
    
    return {
      data: data as T,
      error: null,
      status
    };
  } catch (err: any) {
    console.error(`Exception calling function ${functionName}:`, err);
    const formattedError = formatError(err);
    return {
      data: null,
      error: formattedError.message,
      status: formattedError.status
    };
  } finally {
    performanceTracker.endMeasure(trackingId);
  }
}

/**
 * Determines if an error is recoverable
 * @param error The error to check
 * @returns True if the error is recoverable
 */
function isRecoverableError(error: any): boolean {
  if (!error) return false;
  
  // Check for specific error codes that indicate transient issues
  if (error.code === "42P17" || // Infinite recursion
      error.code === "57014" || // Query timeout
      error.code === "57P01" || // Admin shutdown
      error.code === "08000" || // Connection exception
      error.code === "08006") { // Connection failure
    return true;
  }
  
  // Check error message for specific patterns
  if (error.message && (
    error.message.includes("infinite recursion") ||
    error.message.includes("timeout") ||
    error.message.includes("temporarily unavailable") ||
    error.message.includes("connection") ||
    error.message.includes("too many clients") ||
    error.message.includes("deadlock detected")
  )) {
    return true;
  }
  
  return false;
}

/**
 * Checks if a database function exists
 * Note: This requires appropriate permissions
 */
export async function checkFunctionExists(functionName: string): Promise<boolean> {
  try {
    // Use direct any type assertion for simplicity
    const { data, error } = await (supabase.rpc as any)('function_exists', { 
      function_name: functionName 
    });
    
    if (error) {
      console.error(`Error checking if function exists:`, error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error(`Exception checking if function exists:`, err);
    return false;
  }
}
