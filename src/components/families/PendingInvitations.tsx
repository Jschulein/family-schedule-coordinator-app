import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  last_invited: string;
}

interface PendingInvitationsProps {
  familyId: string;
}

export const PendingInvitations = ({ familyId }: PendingInvitationsProps) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("family_id", familyId)
        .eq("status", "pending");

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load invitations" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .update({ last_invited: new Date().toISOString() })
        .eq("id", invitationId);

      if (error) throw error;
      toast({ title: "Success", description: "Invitation resent successfully!" });
      fetchInvitations();
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to resend invitation" });
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [familyId]);

  if (loading) return <div>Loading...</div>;

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
                  <p>{invitation.email}</p>
                  <p className="text-sm text-muted-foreground">Role: {invitation.role}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleResendInvite(invitation.id)}
                >
                  Resend
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
