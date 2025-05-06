
import { useState, useEffect, useCallback } from "react";
import { FamilyMember } from "@/types/familyTypes";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "./useFamilyContext";

/**
 * Custom hook for fetching and managing family members data
 * Optimized to avoid infinite recursion RLS issues
 * @returns Family members data and loading/error states
 */
export const useFamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { activeFamilyId } = useFamilyContext();

  // Memoized loading function to prevent unnecessary rerenders
  const loadFamilyMembers = useCallback(async () => {
    // Don't fetch if no active family or already loading
    if (!activeFamilyId || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching members for family: ${activeFamilyId}`);
      
      // Use the direct security definer function to avoid RLS recursion
      const { data, error: fetchError } = await supabase
        .rpc('get_family_members_without_recursion', { 
          p_family_ids: [activeFamilyId]
        });
      
      if (fetchError) {
        console.error("Error fetching family members:", fetchError);
        setError("Failed to load family members");
        toast({ 
          title: "Error", 
          description: "Failed to load family members" 
        });
        return;
      }
      
      if (data) {
        console.log(`Loaded ${data.length} family members`);
        setFamilyMembers(data);
      } else {
        setFamilyMembers([]);
      }
    } catch (e) {
      console.error("Unexpected error in useFamilyMembers hook:", e);
      setError("An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred while loading family members" 
      });
    } finally {
      setLoading(false);
    }
  }, [activeFamilyId, loading]);

  // Initial load when active family changes
  useEffect(() => {
    if (activeFamilyId) {
      loadFamilyMembers();
    } else {
      // Clear members when no family is active
      setFamilyMembers([]);
    }
  }, [activeFamilyId, loadFamilyMembers]);

  return {
    familyMembers,
    loading,
    error,
    refreshFamilyMembers: loadFamilyMembers
  };
};
