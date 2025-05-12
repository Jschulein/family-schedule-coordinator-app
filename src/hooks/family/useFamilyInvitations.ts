
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FamilyInvitation } from "@/types/familyTypes";
import { 
  getFamilyInvitations, 
  resendInvitation 
} from "@/services/families/simplifiedFamilyService";

type InvitationHookOptions = {
  familyId: string | null;
  refreshTrigger?: boolean;
  enableRealtime?: boolean;
};

/**
 * Hook for managing family invitations with optimized performance
 * @param options Hook configuration options
 * @returns Invitation data and utility functions
 */
export function useFamilyInvitations({
  familyId, 
  refreshTrigger = false,
  enableRealtime = true
}: InvitationHookOptions) {
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);

  // Memoized fetch function to prevent unnecessary rerenders
  const fetchInvitations = useCallback(async () => {
    if (!familyId) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching invitations for family ${familyId}`);
      
      const result = await getFamilyInvitations(familyId);
      
      if (result.isError || !result.data) {
        toast({ 
          title: "Error", 
          description: result.error || "Failed to load invitations" 
        });
        setInvitations([]);
        return;
      }
      
      console.log(`Retrieved ${result.data.length} invitations`);
      
      // Map the data to match our FamilyInvitation interface
      const mappedInvitations: FamilyInvitation[] = result.data.map(invitation => ({
        id: invitation.id,
        family_id: invitation.family_id,
        email: invitation.email,
        name: invitation.name || invitation.email,
        role: invitation.role,
        status: invitation.status,
        invited_at: invitation.invited_at,
        invited_by: invitation.invited_by,
        last_invited: invitation.last_invited || invitation.invited_at
      }));
      
      setInvitations(mappedInvitations);
    } catch (error) {
      console.error("Error in useFamilyInvitations hook:", error);
      setInvitations([]);
      toast({ 
        title: "Error", 
        description: "Failed to load invitations" 
      });
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  // Optimized resend invitation function with proper error handling
  const handleResendInvite = useCallback(async (invitationId: string) => {
    try {
      setResending(invitationId);
      console.log(`Resending invitation ${invitationId}`);
      
      const result = await resendInvitation(invitationId);
      
      if (result.isError) {
        toast({ 
          title: "Error", 
          description: result.error || "Failed to resend invitation" 
        });
        return;
      }
      
      toast({ 
        title: "Success", 
        description: "Invitation resent successfully!" 
      });
      
      // Refresh invitations to reflect the updated last_invited time
      await fetchInvitations();
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred while resending the invitation" 
      });
    } finally {
      setResending(null);
    }
  }, [fetchInvitations]);

  // Fetch invitations on mount and when familyId or refreshTrigger changes
  useEffect(() => {
    if (familyId) {
      fetchInvitations();
    }
  }, [familyId, refreshTrigger, fetchInvitations]);

  // Set up realtime subscription for invitations
  useEffect(() => {
    if (!enableRealtime || !familyId) return;
    
    console.log(`Setting up realtime subscription for invitations in family ${familyId}`);
    
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
  }, [familyId, fetchInvitations, enableRealtime]);

  return {
    invitations,
    loading,
    resending,
    resendInvite: handleResendInvite,
    refreshInvitations: fetchInvitations
  };
}
