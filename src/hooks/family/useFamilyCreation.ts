
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { Family } from "@/types/familyTypes";
import { createFamily as createFamilyService } from "@/services/families/simplifiedFamilyService";

/**
 * Custom hook for family creation
 */
export function useFamilyCreation(onSuccessCallback?: (family: Family) => void) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createFamily = useCallback(async (name: string) => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a family name" });
      return null;
    }

    setCreating(true);
    setError(null);
    
    try {
      console.log("Creating new family:", name);
      
      const result = await createFamilyService(name);
      
      if (result.error) {
        setError(result.error);
        toast({ title: "Error", description: result.error || "Failed to create family" });
        return null;
      }
      
      if (!result.data) {
        throw new Error("No data returned when creating family");
      }
      
      toast({ title: "Success", description: "Family created successfully!" });
      
      if (onSuccessCallback) {
        onSuccessCallback(result.data);
      }
      
      return result.data;
    } catch (error: any) {
      console.error("Error creating family:", error);
      setError(error.message || "An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "Failed to create family", 
        variant: "destructive"
      });
      return null;
    } finally {
      setCreating(false);
    }
  }, [onSuccessCallback]);

  return {
    creating,
    createFamily,
    error
  };
}
