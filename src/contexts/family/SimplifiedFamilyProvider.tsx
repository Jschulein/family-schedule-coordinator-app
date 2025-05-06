
/**
 * Simplified family provider with cleaner data access patterns
 */
import { useState, useCallback, ReactNode, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import type { Family } from "@/types/familyTypes";
import { getUserFamilies, createFamily as createFamilyService } from "@/services/families/simpleFamilyService";
import { FamilyContext } from "./FamilyContext";

interface FamilyProviderProps {
  children: ReactNode;
}

export const SimplifiedFamilyProvider = ({ children }: FamilyProviderProps) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(() =>
    localStorage.getItem("activeFamilyId")
  );

  // Fetch families with simplified error handling
  const fetchFamilies = useCallback(async () => {
    console.log("FamilyContext: fetchFamilies called");
    setLoading(true);
    setError(null);
    
    const result = await getUserFamilies();
    
    if (result.isError) {
      setError(result.error || "Failed to load families");
      toast({ 
        title: "Error", 
        description: "Failed to load families", 
        variant: "destructive"
      });
    } else {
      console.log(`FamilyContext: fetched ${result.data?.length} families`);
      setFamilies(result.data || []);
      
      // Handle family selection logic
      if (!activeFamilyId && result.data && result.data.length > 0) {
        console.log("No active family, setting first family as active");
        handleSelectFamily(result.data[0].id);
      } else if (activeFamilyId && result.data && !result.data.some(f => f.id === activeFamilyId)) {
        console.log("Active family not found in results, clearing selection");
        setActiveFamilyId(null);
        localStorage.removeItem("activeFamilyId");
      }
    }
    
    setLoading(false);
  }, [activeFamilyId]);

  // Create a new family with simplified error handling
  const createFamilyHandler = async (name: string) => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a family name" });
      return;
    }

    setCreating(true);
    setError(null);
    
    const result = await createFamilyService(name);
    
    if (result.isError) {
      setError(result.error || "Failed to create family");
      toast({ 
        title: "Error", 
        description: result.error || "Failed to create family" 
      });
      setCreating(false);
      return;
    }
    
    toast({ title: "Success", description: "Family created successfully!" });
    
    // Refresh family list
    await fetchFamilies();
    
    // Set new family as active
    if (result.data) {
      handleSelectFamily(result.data.id);
    }
    
    setCreating(false);
    return result.data;
  };

  // Select a family
  const handleSelectFamily = (familyId: string) => {
    console.log("FamilyContext: selecting family:", familyId);
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  };

  // Initial load
  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  return (
    <FamilyContext.Provider
      value={{
        families,
        loading,
        error,
        creating,
        activeFamilyId,
        fetchFamilies,
        createFamily: createFamilyHandler,
        handleSelectFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
