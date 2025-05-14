
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FamilyMember } from "@/types/familyTypes";
import { toast } from "@/components/ui/use-toast";

/**
 * Hook for fetching and managing family members for a specific family
 * @param familyId The ID of the family to fetch members for
 * @returns Family members data and loading/error states
 */
export const useFamilyMembers = (familyId: string | null) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized function to fetch family members to prevent rerenders
  const fetchMembers = useCallback(async () => {
    if (!familyId) {
      console.log("No family ID provided to useFamilyMembers");
      setMembers([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching family members for family: ${familyId}`);
      
      // Use the security definer function to bypass RLS recursion issues
      const { data, error } = await supabase
        .rpc('get_family_members_safe', {
          p_family_id: familyId
        });
      
      if (error) {
        console.error("Error fetching family members:", error);
        setError(`Failed to load family members: ${error.message}`);
        return;
      }

      console.log(`Loaded ${data?.length || 0} family members`);
      setMembers(data || []);
    } catch (err: any) {
      console.error("Unexpected error in useFamilyMembers:", err);
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  // Fetch members when the family changes
  useEffect(() => {
    if (familyId) {
      fetchMembers();
    } else {
      setMembers([]);
    }
  }, [familyId, fetchMembers]);

  // Set up a subscription for real-time updates to family members
  useEffect(() => {
    if (!familyId) return;
    
    const channel = supabase
      .channel(`family-members-${familyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_members', filter: `family_id=eq.${familyId}` },
        (payload) => {
          console.log("Family members changed, refreshing data");
          fetchMembers();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, fetchMembers]);

  return {
    members,
    loading,
    error,
    refreshMembers: fetchMembers
  };
};

export default useFamilyMembers;
