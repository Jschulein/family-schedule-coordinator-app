
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";

/**
 * Custom hook for handling events data refresh with retry capability
 * @param refetchEvents Function to refresh event data
 * @returns State and handlers for data refresh operations
 */
export function useRefreshEvents(refetchEvents: (showToast?: boolean) => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  /**
   * Handles retry with exponential backoff
   */
  const retryWithBackoff = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setError("Maximum retry attempts reached. Please try again later.");
      return;
    }
    
    const nextRetry = retryCount + 1;
    setRetryCount(nextRetry);
    
    // Exponential backoff: 1s, 2s, 4s
    const backoffTime = Math.pow(2, nextRetry - 1) * 1000;
    
    logEventFlow('RefreshEvents', `Retrying in ${backoffTime}ms (attempt ${nextRetry})`);
    
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    
    if (mountedRef.current) {
      handleRetry();
    }
  }, [retryCount]);
  
  /**
   * Handle retry attempt
   */
  const handleRetry = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    // Create new AbortController for this operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    const trackingId = performanceTracker.startMeasure('RefreshEvents:retry');
    
    try {
      logEventFlow('RefreshEvents', 'Starting refresh attempt');
      
      // Check if aborted
      if (signal.aborted) {
        throw new Error("Refresh operation was cancelled");
      }
      
      await refetchEvents(false);
      
      // Check if aborted after the operation
      if (signal.aborted) {
        throw new Error("Refresh operation was cancelled during execution");
      }
      
      if (mountedRef.current) {
        toast({
          title: "Success",
          description: "Event data refreshed successfully"
        });
        setRetryCount(0);
        setError(null);
      }
    } catch (error: any) {
      // Skip error handling if aborted intentionally
      if (error.name === 'AbortError') {
        logEventFlow('RefreshEvents', 'Refresh aborted intentionally');
        return;
      }
      
      logEventFlow('RefreshEvents', 'Error during refresh', error);
      
      if (mountedRef.current) {
        const errorMessage = error?.message || "Failed to refresh event data";
        setError(errorMessage);
        
        // Only show toast for final failure
        if (retryCount >= maxRetries - 1) {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          });
        } else {
          // Auto-retry with backoff
          retryWithBackoff();
        }
      }
    } finally {
      performanceTracker.endMeasure(trackingId);
      
      if (mountedRef.current && !signal.aborted) {
        setIsRefreshing(false);
      }
      
      // Clear the abort controller reference
      abortControllerRef.current = null;
    }
  }, [isRefreshing, refetchEvents, retryCount, retryWithBackoff]);
  
  /**
   * Cancels the current refresh operation if one is in progress
   */
  const cancelRefresh = () => {
    if (abortControllerRef.current && isRefreshing) {
      abortControllerRef.current.abort();
      setIsRefreshing(false);
      setError("Refresh operation cancelled");
      logEventFlow('RefreshEvents', 'Refresh cancelled by user');
    }
  };
  
  return {
    isRefreshing,
    error,
    retryCount,
    handleRetry,
    cancelRefresh
  };
}
