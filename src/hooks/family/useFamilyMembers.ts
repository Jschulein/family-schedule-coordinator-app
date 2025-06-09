
import { useState, useEffect } from "react";
import { FamilyMember } from "@/types/familyTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export function useFamilyMembers(familyId: string | null) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!familyId) {
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try using the RPC function first
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_family_members_safe', {
        p_family_id: familyId
      });

      if (rpcError) {
        console.warn("RPC function failed, falling back to direct query:", rpcError);
        
        // Fallback to direct query
        const { data: directData, error: directError } = await (supabase as any)
          .from('family_members')
          .select('*')
          .eq('family_id', familyId);

        if (directError) {
          throw new Error(directError.message);
        }

        setMembers(directData || []);
      } else {
        setMembers(rpcData || []);
      }
    } catch (err: any) {
      console.error("Error fetching family members:", err);
      setError(err.message || "Failed to fetch family members");
      toast({
        title: "Error",
        description: "Failed to load family members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [familyId]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers
  };
}
