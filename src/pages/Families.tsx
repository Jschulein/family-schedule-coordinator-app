
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useFamilies } from "@/hooks/useFamilies";
import { CreateFamilyForm } from "@/components/families/CreateFamilyForm";
import { FamilyList } from "@/components/families/FamilyList";
import { InviteMemberForm } from "@/components/families/InviteMemberForm";
import { PendingInvitations } from "@/components/families/PendingInvitations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useEvents } from "@/contexts/EventContext";

const FamiliesPage = () => {
  const {
    families,
    loading,
    error,
    creating,
    activeFamilyId,
    fetchFamilies,
    createFamily,
    handleSelectFamily,
  } = useFamilies();
  
  const [refreshingInvitations, setRefreshingInvitations] = useState(false);
  const { refetchEvents } = useEvents();

  // When active family changes, refresh events
  useEffect(() => {
    if (activeFamilyId) {
      // Refresh events when family changes to show updated family events
      refetchEvents().catch(err => 
        console.error("Error refreshing events after family change:", err)
      );
    }
  }, [activeFamilyId, refetchEvents]);

  const handleInviteSent = async () => {
    setRefreshingInvitations(true);
    try {
      // Refresh both families and invitations
      await fetchFamilies();
      toast({ title: "Success", description: "Invitation sent and data refreshed" });
    } catch (error) {
      console.error("Error refreshing data after invitation:", error);
      toast({ title: "Warning", description: "Invitation sent but failed to refresh data" });
    } finally {
      setRefreshingInvitations(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Families</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchFamilies} 
            disabled={loading}
            title="Refresh families"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <CreateFamilyForm onSubmit={createFamily} creating={creating} />

        {loading ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <FamilyList
              families={families}
              activeFamilyId={activeFamilyId}
              onSelectFamily={handleSelectFamily}
            />

            {activeFamilyId && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Family Member</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InviteMemberForm 
                      familyId={activeFamilyId}
                      onInviteSent={handleInviteSent}
                    />
                  </CardContent>
                </Card>
                
                <PendingInvitations 
                  familyId={activeFamilyId} 
                  refreshing={refreshingInvitations}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamiliesPage;
