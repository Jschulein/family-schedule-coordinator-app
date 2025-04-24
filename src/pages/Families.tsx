
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
                      onInviteSent={fetchFamilies}
                    />
                  </CardContent>
                </Card>
                
                <PendingInvitations familyId={activeFamilyId} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamiliesPage;
