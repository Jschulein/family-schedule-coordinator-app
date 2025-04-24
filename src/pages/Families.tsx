import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { InviteMemberForm } from "@/components/families/InviteMemberForm";
import { PendingInvitations } from "@/components/families/PendingInvitations";

type Family = {
  id: string;
  name: string;
};

const FamiliesPage = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(() =>
    localStorage.getItem("activeFamilyId")
  );

  useEffect(() => {
    const fetchFamilies = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError("Could not load user information.");
        setLoading(false);
        return;
      }
      const { data, error: famErr } = await supabase
        .from("family_members")
        .select("family_id, families(name, id)")
        .eq("user_id", user.id);

      if (famErr) {
        setError("Failed to fetch families.");
        setLoading(false);
        return;
      }
      const uniqueFamilies: Family[] = [];
      const seen = new Set();
      for (const fm of data ?? []) {
        if (fm.families && !seen.has(fm.families.id)) {
          uniqueFamilies.push({ id: fm.families.id, name: fm.families.name });
          seen.add(fm.families.id);
        }
      }
      setFamilies(uniqueFamilies);
      setLoading(false);
    };
    fetchFamilies();
  }, []);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    setLoading(true);
    setError(null);

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      setError("You must be logged in to create a family.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("families")
      .insert({ name: newFamilyName, created_by: user.id })
      .select("*")
      .single();

    if (error || !data) {
      setError("Failed to create family.");
      setLoading(false);
      return;
    }
    setFamilies((f) => [...f, { id: data.id, name: data.name }]);
    setNewFamilyName("");
    setLoading(false);
  };

  const handleSelectFamily = (familyId: string) => {
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-4">Your Families</h1>
        
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
                disabled={loading}
                required
              />
              <Button type="submit" disabled={loading}>
                Create
              </Button>
            </form>
            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
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
                  onInviteSent={() => {}} 
                />
              </CardContent>
            </Card>

            <PendingInvitations familyId={activeFamilyId} />
          </>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Switch Family</h2>
          {loading ? (
            <p>Loading families...</p>
          ) : (
            <div className="space-y-3">
              {families.length === 0 && 
                <p className="text-gray-600">You are not a member of any families yet.</p>
              }
              {families.map((fam) => (
                <Card
                  key={fam.id}
                  className={`flex flex-row items-center justify-between ${
                    fam.id === activeFamilyId ? "border-green-500" : ""
                  }`}
                >
                  <CardContent className="flex-1">{fam.name}</CardContent>
                  <Button
                    variant={fam.id === activeFamilyId ? "default" : "outline"}
                    onClick={() => handleSelectFamily(fam.id)}
                  >
                    {fam.id === activeFamilyId ? "Active" : "Set Active"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamiliesPage;
