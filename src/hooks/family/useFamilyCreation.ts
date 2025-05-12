
import { useState, useCallback } from 'react';
import { createFamily } from '@/services/families/simplifiedFamilyService';
import type { Family } from '@/types/familyTypes';
import { toast } from '@/components/ui/use-toast';
import { checkFamilySystemHealth } from '@/utils/diagnostics/familyHealthCheck';

type OnSuccessCallback = (family?: Family) => void;

interface FamilyCreationOptions {
  onSuccess?: OnSuccessCallback;
  performHealthCheck?: boolean;
  maxRetries?: number;
}

/**
 * Hook for creating families with improved error handling, diagnostics and retry capability
 * @param options Configuration options
 * @returns Object with creating state, error state, and createFamily function
 */
export function useFamilyCreation(options: FamilyCreationOptions = {}) {
  const { onSuccess, performHealthCheck = true, maxRetries = 2 } = options;
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check system health before attempting family creation
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const healthResult = await checkFamilySystemHealth();
      const canProceed = healthResult.status !== 'error' && healthResult.canCreateFamily;
      setIsHealthy(canProceed);
      
      if (!canProceed) {
        const issues = healthResult.issues.join(', ');
        setError(`System check failed: ${issues}`);
        toast({ 
          title: "System Issue Detected", 
          description: "The family creation system is currently experiencing issues. Please try again later.", 
          variant: "destructive" 
        });
        console.error("Family system health check failed:", healthResult);
      }
      
      return canProceed;
    } catch (err) {
      console.error("Error checking family system health:", err);
      setIsHealthy(false);
      return false;
    }
  }, []);

  const createFamilyHandler = useCallback(async (name: string) => {
    if (!name.trim()) {
      toast({ 
        title: "Error", 
        description: "Family name cannot be empty" 
      });
      setError("Family name cannot be empty");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Optionally perform a health check before attempting creation
      if (performHealthCheck) {
        const isSystemHealthy = await checkHealth();
        if (!isSystemHealthy) {
          setCreating(false);
          return;
        }
      }

      const result = await createFamily(name);

      if (result.isError || !result.data) {
        // Check if this is a recoverable error that warrants retry
        const shouldRetry = retryCount < maxRetries && 
                           (result.error?.includes("recursion") || 
                            result.error?.includes("temporarily unavailable") ||
                            result.error?.includes("timeout") ||
                            result.error?.includes("connection"));
        
        if (shouldRetry) {
          // Increment retry count
          setRetryCount(prev => prev + 1);
          
          // Use exponential backoff: 1s, 2s, 4s, etc.
          const delay = Math.pow(2, retryCount) * 1000;
          
          toast({
            title: `Retrying (${retryCount + 1}/${maxRetries})`,
            description: `Encountered a temporary issue. Retrying in ${delay/1000}s...`
          });
          
          // Wait for backoff period
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Recursive retry after delay
          setCreating(false);
          return createFamilyHandler(name);
        }
        
        // Not retrying or out of retries
        setError(result.error || "Failed to create family");
        toast({ 
          title: "Error", 
          description: result.error || "Failed to create family" 
        });
        return;
      }

      // Reset retry count on success
      setRetryCount(0);

      toast({ 
        title: "Success", 
        description: "Family created successfully!" 
      });

      if (onSuccess) {
        onSuccess(result.data);
      }

      return result.data;
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to create family. Please try again.";
      setError(errorMessage);
      
      toast({ 
        title: "Error", 
        description: errorMessage 
      });
    } finally {
      setCreating(false);
    }
  }, [onSuccess, performHealthCheck, checkHealth, retryCount, maxRetries]);

  return {
    creating,
    error,
    isHealthy,
    retryCount,
    createFamily: createFamilyHandler,
    checkHealth
  };
}
