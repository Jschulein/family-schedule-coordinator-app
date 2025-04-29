
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, AlertCircle } from "lucide-react";
import { FamilyList } from "@/components/families/FamilyList";
import { InviteMemberForm } from "@/components/families/InviteMemberForm";
import { PendingInvitations } from "@/components/families/PendingInvitations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { CreateFamilyWithMembersForm } from "@/components/families/CreateFamilyWithMembersForm";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useFamilyContext } from "@/contexts/FamilyContext";

// Import the useEvents hook but make it optional to avoid errors when context is not available
import { useEvents } from "@/contexts/EventContext";

const FamiliesPage = () => {
  const {
    families,
    loading,
    error,
    activeFamilyId,
    fetchFamilies,
    handleSelectFamily,
  } = useFamilyContext();
  
  const [refreshingInvitations, setRefreshingInvitations] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Try to use the events context if available, otherwise provide a no-op function
  let refetchEvents = () => Promise.resolve();
  try {
    const eventsContext = useEvents();
    if (eventsContext) {
      refetchEvents = eventsContext.refetchEvents;
    }
  } catch (e) {
    console.log("EventContext not available, skipping event refetch functionality");
  }

  // When active family changes, refresh events if context is available
  useEffect(() => {
    if (activeFamilyId) {
      // Try to refresh events when family changes
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

  const handleFamilyCreated = () => {
    fetchFamilies();
    setSheetOpen(false);  // Close the sheet when family is created
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Families</h1>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchFamilies} 
              disabled={loading}
              title="Refresh families"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button>Create New Family</Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <CreateFamilyWithMembersForm onSuccess={handleFamilyCreated} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
                    <CardTitle>Invite Additional Family Member</CardTitle>
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
