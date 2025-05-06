
import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { Family } from "@/types/familyTypes";
import { getUserFamilies } from "@/services/families/simplifiedFamilyService";

/**
 * Custom hook for managing family data fetching and state
 */
export function useFamilyData() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch families data
  const fetchFamilies = useCallback(async () => {
    console.log("useFamilyData: fetchFamilies called");
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
        return [];
      }
      
      const familiesData = result.data || [];
      console.log(`useFamilyData: fetched ${familiesData.length} families`);
      
      setFamilies(familiesData);
      return familiesData;
    } catch (error: any) {
      console.error("Error in fetchFamilies:", error);
      setError(error.message || "An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "Failed to load families", 
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    families,
    loading,
    error,
    fetchFamilies
  };
}
