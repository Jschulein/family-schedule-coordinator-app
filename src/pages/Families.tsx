
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, AlertCircle, Plus, Gauge } from "lucide-react";
import { FamilyList } from "@/components/families/FamilyList";
import { InviteMemberForm } from "@/components/families/InviteMemberForm";
import { PendingInvitations } from "@/components/families/PendingInvitations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { CreateFamilyWithMembersForm } from "@/components/families/CreateFamilyWithMembersForm";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useFamilyContext } from "@/contexts/family";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { runFamilySystemDiagnostics } from "@/utils/diagnostics/familyHealthCheck";

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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [diagnosticsRun, setDiagnosticsRun] = useState(false);
  
  // Monitor performance of this page
  const { trackInteraction } = usePerformanceMonitor('FamiliesPage');
  
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

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchFamilies();
        setConnectionError(null);
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setConnectionError("Could not connect to the server. Please check your connection and try again.");
      }
    };
    
    loadInitialData();
  }, [fetchFamilies]);

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
    const endTracking = trackInteraction('invite-sent');
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
      endTracking();
    }
  };

  const handleFamilyCreated = () => {
    const endTracking = trackInteraction('family-created');
    
    fetchFamilies();
    setSheetOpen(false);  // Close the sheet when family is created
    
    endTracking();
  };

  const handleRefresh = () => {
    const endTracking = trackInteraction('refresh-families');
    fetchFamilies();
    setConnectionError(null);
    endTracking();
  };

  const runDiagnostics = async () => {
    const endTracking = trackInteraction('run-diagnostics');
    toast({ title: "Diagnostics", description: "Running system diagnostics..." });
    
    try {
      await runFamilySystemDiagnostics();
      setDiagnosticsRun(true);
      toast({ title: "Diagnostics", description: "Diagnostics complete. Check browser console for details." });
    } catch (err) {
      console.error("Error running diagnostics:", err);
      toast({ 
        title: "Diagnostics Error", 
        description: "Failed to run diagnostics. See console for details.",
        variant: "destructive"
      });
    }
    
    endTracking();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Families</h1>
          <div className="flex space-x-2">
            {(error || connectionError) && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={runDiagnostics} 
                title="Run diagnostics"
              >
                <Gauge className="h-4 w-4" />
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={loading}
              title="Refresh families"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Family
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create New Family</SheetTitle>
                </SheetHeader>
                <CreateFamilyWithMembersForm onSuccess={handleFamilyCreated} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        {connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
        
        {error && !connectionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {diagnosticsRun && (
          <Alert>
            <Gauge className="h-4 w-4" />
            <AlertTitle>Diagnostics Complete</AlertTitle>
            <AlertDescription>
              System diagnostics have been run. Please check your browser console (F12) for detailed results.
            </AlertDescription>
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
              onRetry={handleRefresh}
              error={error}
            />

            {families.length === 0 && !error && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <p className="text-center text-muted-foreground mb-4">
                    You don't have any families yet. Create your first family to get started!
                  </p>
                  <Button onClick={() => setSheetOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Family
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeFamilyId && families.length > 0 && (
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
