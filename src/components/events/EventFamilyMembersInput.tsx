
import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface FamilyMember {
  id: string;
  email: string;
  role: string;
}

interface EventFamilyMembersInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const EventFamilyMembersInput = ({ value, onChange }: EventFamilyMembersInputProps) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      const { data: members, error } = await supabase
        .from('family_members')
        .select('*')
        .order('email');

      if (error) {
        setError("Failed to load family members");
        return;
      }

      setFamilyMembers(members);
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

  return (
    <div className="space-y-2">
      <Label>Family Members</Label>
      <div className="grid grid-cols-1 gap-2">
        {familyMembers.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => toggleMember(member.id)}
            className={`flex items-center justify-between p-3 text-left rounded-lg border transition-colors
              ${value.includes(member.id) 
                ? "bg-primary/10 border-primary" 
                : "hover:bg-muted"}`}
          >
            <span>{member.email}</span>
            {value.includes(member.id) && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {familyMembers.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">No family members found</p>
      )}
    </div>
  );
};
