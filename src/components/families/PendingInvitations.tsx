
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_invited: string;
}

interface PendingInvitationsProps {
  familyId: string;
  refreshing?: boolean;
}

export const PendingInvitations = ({ familyId, refreshing = false }: PendingInvitationsProps) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("family_id", familyId)
        .eq("status", "pending");

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error("Error loading invitations:", error.message);
      toast({ title: "Error", description: "Failed to load invitations" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    try {
      setResending(invitationId);
      const { error } = await supabase
        .from("invitations")
        .update({ last_invited: new Date().toISOString() })
        .eq("id", invitationId);

      if (error) throw error;
      toast({ title: "Success", description: "Invitation resent successfully!" });
      fetchInvitations();
    } catch (error: any) {
      console.error("Error resending invitation:", error.message);
      toast({ title: "Error", description: "Failed to resend invitation" });
    } finally {
      setResending(null);
    }
  };

  useEffect(() => {
    if (familyId) {
      fetchInvitations();
    }
  }, [familyId]);
  
  // Re-fetch when refreshing prop changes
  useEffect(() => {
    if (refreshing && familyId) {
      fetchInvitations();
    }
  }, [refreshing, familyId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground">No pending invitations</p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{invitation.name || invitation.email}</p>
                  <p className="text-sm text-muted-foreground">{invitation.email}</p>
                  <p className="text-xs text-muted-foreground">Role: {invitation.role}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleResendInvite(invitation.id)}
                  disabled={resending === invitation.id}
                >
                  {resending === invitation.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : "Resend"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
