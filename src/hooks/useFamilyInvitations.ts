
import { useState, useEffect } from "react";
import { fetchFamilyInvitations, resendFamilyInvitation } from "@/services/familyService";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface FamilyInvitation {
  id: string;
  email: string;
  name?: string;
  role: string;
  status: string;
  last_invited: string;
}

export function useFamilyInvitations(familyId: string | null, refreshTrigger = false) {
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!familyId) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await fetchFamilyInvitations(familyId);
      
      if (result.isError || !result.data) {
        toast({ title: "Error", description: "Failed to load invitations" });
        setInvitations([]);
        return;
      }
      
      // Map the data to match our Invitation interface
      const mappedInvitations: FamilyInvitation[] = result.data.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        name: invitation.name || invitation.email,
        role: invitation.role,
        status: invitation.status,
        last_invited: invitation.last_invited || invitation.invited_at
      }));
      
      setInvitations(mappedInvitations);
    } catch (error) {
      console.error("Error in useFamilyInvitations hook:", error);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    try {
      setResending(invitationId);
      
      const result = await resendFamilyInvitation(invitationId);
      
      if (result.isError) {
        toast({ title: "Error", description: result.error || "Failed to resend invitation" });
        return;
      }
      
      toast({ title: "Success", description: "Invitation resent successfully!" });
      await fetchInvitations();
    } finally {
      setResending(null);
    }
  };

  // Fetch invitations on mount and when familyId or refreshTrigger changes
  useEffect(() => {
    if (familyId) {
      fetchInvitations();
    }
  }, [familyId, refreshTrigger]);

  // Set up realtime subscription for invitations
  useEffect(() => {
    if (!familyId) return;
    
    const channel = supabase
      .channel('invitation-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'invitations', filter: `family_id=eq.${familyId}` }, 
        () => {
          console.log('Invitation changes detected, refreshing data');
          fetchInvitations();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  return {
    invitations,
    loading,
    resending,
    resendInvite: handleResendInvite,
    refreshInvitations: fetchInvitations
  };
}
