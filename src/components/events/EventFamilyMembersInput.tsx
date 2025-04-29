
import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface FamilyMember {
  id: string;
  email: string;
  role: string;
  name?: string;
}

interface EventFamilyMembersInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const EventFamilyMembersInput = ({ value, onChange }: EventFamilyMembersInputProps) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get user's families through the secure function
        const { data: userFamilies, error: familiesError } = await supabase
          .rpc('user_families');

        if (familiesError) {
          console.error("Error fetching user families:", familiesError);
          setError("Failed to load family information");
          return;
        }

        if (!userFamilies || userFamilies.length === 0) {
          console.log("No families found for current user");
          setFamilyMembers([]);
          setLoading(false);
          return;
        }
        
        // Extract just the family IDs
        const familyIds = userFamilies.map(f => f.family_id);
        
        // Fetch members directly by family IDs to avoid RLS recursion
        const { data: members, error: membersError } = await supabase
          .from('family_members')
          .select('*')
          .in('family_id', familyIds)
          .order('email');

        if (membersError) {
          console.error("Error fetching family members:", membersError);
          setError("Failed to load family members");
          toast({ title: "Error", description: "Failed to load family members" });
          return;
        }

        console.log(`Successfully loaded ${members?.length || 0} family members`);
        setFamilyMembers(members || []);
      } catch (err) {
        console.error("Error in fetchFamilyMembers:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, []);

  const toggleMember = (memberId: string) => {
    if (value.includes(memberId)) {
      onChange(value.filter(id => id !== memberId));
    } else {
      onChange([...value, memberId]);
    }
  };

  // Helper to display member name or email if name is empty
  const getMemberDisplayName = (member: FamilyMember) => {
    return member.name && member.name.trim() !== '' ? member.name : member.email;
  };

  return (
    <div className="space-y-2">
      <Label>Family Members</Label>
      <div className="grid grid-cols-1 gap-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading family members...</p>
        ) : (
          familyMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => toggleMember(member.id)}
              className={`flex items-center justify-between p-3 text-left rounded-lg border transition-colors
                ${value.includes(member.id) 
                  ? "bg-primary/10 border-primary" 
                  : "hover:bg-muted"}`}
            >
              <span>{getMemberDisplayName(member)}</span>
              {value.includes(member.id) && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && familyMembers.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">No family members found</p>
      )}
    </div>
  );
};
