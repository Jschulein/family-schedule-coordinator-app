
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { InviteMemberForm } from "@/components/families/InviteMemberForm";
import { PendingInvitations } from "@/components/families/PendingInvitations";
import { toast } from "@/components/ui/sonner";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Family = {
  id: string;
  name: string;
};

const FamiliesPage = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(() =>
    localStorage.getItem("activeFamilyId")
  );

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Authentication required");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("family_members")
        .select("family_id, families(name, id)")
        .eq("user_id", user.id);

      if (error) throw error;

      const uniqueFamilies: Family[] = [];
      const seen = new Set();
      for (const fm of data ?? []) {
        if (fm.families && !seen.has(fm.families.id)) {
          uniqueFamilies.push({ id: fm.families.id, name: fm.families.name });
          seen.add(fm.families.id);
        }
      }
      setFamilies(uniqueFamilies);

      // Set first family as active if none selected
      if (!activeFamilyId && uniqueFamilies.length > 0) {
        handleSelectFamily(uniqueFamilies[0].id);
      } else if (activeFamilyId && !uniqueFamilies.some(f => f.id === activeFamilyId)) {
        // If active family doesn't exist anymore, reset it
        setActiveFamilyId(null);
        localStorage.removeItem("activeFamilyId");
      }
    } catch (error: any) {
      console.error("Error fetching families:", error.message);
      setError("Failed to load families. Please try again.");
      toast.error("Failed to load families");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) {
      toast.error("Please enter a family name");
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        toast.error("You must be logged in to create a family");
        return;
      }

      // First, create the family
      const { data, error } = await supabase
        .from("families")
        .insert({ name: newFamilyName, created_by: user.id })
        .select("id, name")
        .single();

      if (error) throw error;

      if (data) {
        // Add the user as an admin to the new family
        const { error: memberError } = await supabase
          .from("family_members")
          .insert({
            family_id: data.id,
            user_id: user.id,
            role: "admin",
            email: user.email,
          });

        if (memberError) {
          console.error("Error adding member:", memberError);
          // Continue anyway since the trigger should handle this
        }

        setFamilies((prevFamilies) => [...prevFamilies, { id: data.id, name: data.name }]);
        setNewFamilyName("");
        toast.success("Family created successfully!");
        handleSelectFamily(data.id);
      }
    } catch (error: any) {
      console.error("Error creating family:", error.message);
      setError("Failed to create family. Please try again.");
      toast.error("Failed to create family");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFamily = (familyId: string) => {
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  };

  const handleRefreshInvitations = () => {
    // Refresh families list after sending an invitation
    fetchFamilies();
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
        
        <Card>
          <CardHeader>
            <CardTitle>Create a New Family</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex gap-2" onSubmit={handleCreateFamily}>
              <Input
                placeholder="Family name"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                disabled={creating}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {families.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-gray-500">
                    You haven't created or joined any families yet.
                    Create your first family above!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Your Families</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {families.map((fam) => (
                      <Card
                        key={fam.id}
                        className={`flex items-center justify-between p-4 ${
                          fam.id === activeFamilyId ? "border-primary" : ""
                        }`}
                      >
                        <span className="text-lg font-medium">{fam.name}</span>
                        <Button
                          variant={fam.id === activeFamilyId ? "default" : "outline"}
                          onClick={() => handleSelectFamily(fam.id)}
                        >
                          {fam.id === activeFamilyId ? "Active" : "Set Active"}
                        </Button>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {activeFamilyId && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Invite Family Members</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <InviteMemberForm 
                          familyId={activeFamilyId}
                          onInviteSent={handleRefreshInvitations}
                        />
                      </CardContent>
                    </Card>

                    <PendingInvitations familyId={activeFamilyId} />
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamiliesPage;
