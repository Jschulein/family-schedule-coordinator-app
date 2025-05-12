
import { useState, useCallback, useEffect } from "react";
import { FamilyMember } from "@/types/familyTypes";
import { fetchMembersByFamilyId } from "@/services";
import { toast } from "@/components/ui/use-toast";
import { MemberManagementResult } from "./types";

/**
 * Hook for managing family member data
 * @param familyId The ID of the family
 * @returns Family members data and management functions
 */
export function useFamilyMembers(familyId: string | null): MemberManagementResult {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch family members
  const fetchMembers = useCallback(async () => {
    if (!familyId) {
      setMembers([]);
      return;
    }

    console.log(`Fetching members for family ${familyId}`);
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMembersByFamilyId(familyId);
      
      if (result.isError) {
        setError(result.error || "Failed to load family members");
        toast({ 
          title: "Error", 
          description: "Failed to load family members",
          variant: "destructive"
        });
      } else if (result.data) {
        setMembers(result.data);
      } else {
        // Default to empty array if no data
        setMembers([]);
      }
    } catch (e: any) {
      console.error("Unexpected error in useFamilyMembers:", e);
      setError(e.message || "An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "An error occurred while loading family members"
      });
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  // Initial load and when familyId changes
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refreshMembers: fetchMembers
  };
}
