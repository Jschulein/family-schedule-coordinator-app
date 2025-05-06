
import { useState, useCallback, ReactNode, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Family } from "@/types/familyTypes";
import { supabase } from "@/integrations/supabase/client";
import { FamilyContext } from "./FamilyContext";
import { getUserFamilies, createFamily as createFamilyService } from "@/services/families/simplifiedFamilyService";

interface FamilyProviderProps {
  children: ReactNode;
}

export const FamilyProvider = ({ children }: FamilyProviderProps) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(() =>
    localStorage.getItem("activeFamilyId")
  );

  const fetchFamilies = useCallback(async () => {
    console.log("FamilyContext: fetchFamilies called");
    setLoading(true);
    setError(null);
    
    try {
      // Use the simplified service
      const result = await getUserFamilies();
      
      if (result.error) {
        setError(result.error);
        toast({ 
          title: "Error", 
          description: "Failed to load families", 
          variant: "destructive"
        });
        return;
      }
      
      const familiesData = result.data || [];
      console.log(`FamilyContext: fetched ${familiesData.length} families`);
      
      setFamilies(familiesData);
      handleFamilySelection(familiesData);
    } catch (error: any) {
      console.error("Error in fetchFamilies:", error);
      setError(error.message || "An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "Failed to load families", 
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  const handleFamilySelection = (familiesData: Family[]) => {
    // Set first family as active if none selected
    if (!activeFamilyId && familiesData.length > 0) {
      console.log("No active family, setting first family as active");
      handleSelectFamily(familiesData[0].id);
    } else if (activeFamilyId && !familiesData.some(f => f.id === activeFamilyId)) {
      console.log("Active family not found in results, clearing selection");
      setActiveFamilyId(null);
      localStorage.removeItem("activeFamilyId");
    }
  };

  const createFamilyHandler = async (name: string) => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a family name" });
      return null;
    }

    setCreating(true);
    setError(null);
    
    try {
      console.log("FamilyContext: creating new family:", name);
      
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
      
      // Fetch all families again to make sure we have the latest data
      await fetchFamilies();
      
      handleSelectFamily(result.data.id);
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
  };

  const handleSelectFamily = (familyId: string) => {
    console.log("FamilyContext: selecting family:", familyId);
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  };

  // Set up realtime subscription for family changes
  useEffect(() => {
    const channel = supabase
      .channel('family-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'families' }, 
        () => {
          console.log('Family changes detected, refreshing data');
          fetchFamilies();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
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
