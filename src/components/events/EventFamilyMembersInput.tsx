
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { FamilyMember } from "@/types/familyTypes";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";

interface EventFamilyMembersInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const EventFamilyMembersInput = ({ value, onChange }: EventFamilyMembersInputProps) => {
  const { familyMembers, loading, error } = useFamilyMembers();

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
