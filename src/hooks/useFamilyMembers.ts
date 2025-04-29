
import { useState, useEffect } from "react";
import { fetchFamilyMembers } from "@/services/families";
import type { FamilyMember } from "@/types/familyTypes";
import { toast } from "@/components/ui/use-toast";

/**
 * Custom hook for fetching and managing family members data
 * @returns Family members data and loading/error states
 */
export const useFamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFamilyMembers = async () => {
    setLoading(true);
    setError(null);
    
    const result = await fetchFamilyMembers();
    
    if (result.isError) {
      setError(result.error || "Failed to load family members");
      toast({ 
        title: "Error", 
        description: "Failed to load family members" 
      });
    } else if (result.data) {
      setFamilyMembers(result.data);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  return {
    familyMembers,
    loading,
    error,
    refreshFamilyMembers: loadFamilyMembers
  };
};
