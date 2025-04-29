
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { fetchUserFamilies, createFamily as createFamilyService } from "@/services/familyService";
import { Family } from "@/types/familyTypes";
import { handleError } from "@/utils/errorHandler";

export { type Family } from "@/types/familyTypes";

/**
 * Hook for managing family-related state and operations
 */
export const useFamilies = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(() =>
    localStorage.getItem("activeFamilyId")
  );

  const fetchFamilies = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await fetchUserFamilies();
    
    if (result.isError) {
      setError(result.error || "Failed to load families");
      toast({ title: "Error", description: "Failed to load families" });
    } else if (result.data) {
      setFamilies(result.data);
      
      // Set first family as active if none selected
      if (!activeFamilyId && result.data.length > 0) {
        handleSelectFamily(result.data[0].id);
      } else if (activeFamilyId && !result.data.some(f => f.id === activeFamilyId)) {
        setActiveFamilyId(null);
        localStorage.removeItem("activeFamilyId");
      }
    }
    
    setLoading(false);
  }, [activeFamilyId]);

  const createFamilyHandler = async (name: string) => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a family name" });
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      const result = await createFamilyService(name);
      
      if (result.isError) {
        setError(result.error || "Failed to create family");
        toast({ title: "Error", description: result.error || "Failed to create family" });
        throw new Error(result.error);
      }
      
      if (!result.data) {
        throw new Error("No data returned when creating family");
      }
      
      toast({ title: "Success", description: "Family created successfully!" });
      
      // Fetch all families again to make sure we have the latest data
      // The database trigger handle_new_family() will automatically add the creator as an admin
      await fetchFamilies();
      
      handleSelectFamily(result.data.id);
      return result.data;
    } catch (error: any) {
      handleError(error, { 
        context: "Creating family",
        showToast: false // Already handled above
      });
      throw error; // Propagate the error so the form can handle it
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFamily = (familyId: string) => {
    console.log("Selecting family:", familyId);
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  };

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  return {
    families,
    loading,
    error,
    creating,
    activeFamilyId,
    fetchFamilies,
    createFamily: createFamilyHandler,
    handleSelectFamily,
  };
};
