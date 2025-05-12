
import { useState, useCallback } from 'react';
import { createFamily } from '@/services/families/simplifiedFamilyService';
import type { Family } from '@/types/familyTypes';
import { toast } from '@/components/ui/use-toast';

type OnSuccessCallback = (family?: Family) => void;

/**
 * Hook for creating families
 * @param onSuccess Callback function to run on successful family creation
 * @returns Object with creating state, error state, and createFamily function
 */
export function useFamilyCreation(onSuccess?: OnSuccessCallback) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const result = await createFamily(name);

      if (result.isError) {
        setError(result.error || "Failed to create family");
        toast({ 
          title: "Error", 
          description: result.error || "Failed to create family" 
        });
        return;
      }

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
  }, [onSuccess]);

  return {
    creating,
    error,
    createFamily: createFamilyHandler
  };
}
