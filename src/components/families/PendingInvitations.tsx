
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useFamilyInvitations } from "@/hooks/useFamilyInvitations";

interface PendingInvitationsProps {
  familyId: string;
  refreshing?: boolean;
}

export const PendingInvitations = ({ familyId, refreshing = false }: PendingInvitationsProps) => {
  const { invitations, loading, resending, resendInvite } = useFamilyInvitations(familyId, refreshing);

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
                  <p className="font-medium">{invitation.email}</p>
                  <p className="text-sm text-muted-foreground">Role: {invitation.role}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => resendInvite(invitation.id)}
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
}
