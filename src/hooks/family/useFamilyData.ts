
import { useState, useCallback } from "react";
import { callFunction } from "@/services/database/functions";
import type { Family } from "@/types/familyTypes";

/**
 * Custom hook for managing family data
 */
export function useFamilyData() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch families
  const fetchFamilies = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await callFunction<Family[]>("get_user_families");
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      setFamilies(data || []);
    } catch (err: any) {
      console.error("Error in fetchFamilies:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    families,
    loading,
    error,
    fetchFamilies,
  };
}
