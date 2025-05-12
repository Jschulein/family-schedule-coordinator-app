
import { useState, useCallback, useEffect } from "react";
import { Family } from "@/types/familyTypes";
import { getUserFamilies } from "@/services/families/simplifiedFamilyService";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook for fetching and managing family data
 * @returns Family data and loading/error states
 */
export function useFamilyData() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilies = useCallback(async () => {
    console.log("Fetching families data");
    setLoading(true);
    setError(null);

    try {
      const result = await getUserFamilies();
      
      if (result.isError) {
        setError(result.error || "Failed to load families");
        toast({ 
          title: "Error", 
          description: "Failed to load families",
          variant: "destructive"
        });
      } else if (result.data) {
        setFamilies(result.data);
      } else {
        // Default to empty array if no data
        setFamilies([]);
      }
    } catch (e: any) {
      console.error("Unexpected error in useFamilyData:", e);
      setError(e.message || "An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred while loading families"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  return {
    families,
    loading,
    error,
    fetchFamilies
  };
}
