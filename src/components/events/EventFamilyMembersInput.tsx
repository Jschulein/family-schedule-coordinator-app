
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { FamilyMember } from "@/types/familyTypes";
import { useFamilyMembers } from "@/hooks/family/useFamilyMembers";
import { useEffect } from "react";
import { useFamilyContext } from "@/hooks/family/useFamilyContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface EventFamilyMembersInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const EventFamilyMembersInput = ({ value, onChange }: EventFamilyMembersInputProps) => {
  const { activeFamilyId } = useFamilyContext();
  const { familyMembers, loading, error, refreshFamilyMembers } = useFamilyMembers();

  // Refresh family members when the component mounts
  useEffect(() => {
    if (activeFamilyId) {
      refreshFamilyMembers();
    }
  }, [activeFamilyId, refreshFamilyMembers]);

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

  if (!activeFamilyId) {
    return (
      <div className="space-y-2">
        <Label>Family Members</Label>
        <p className="text-sm text-muted-foreground">
          Please select a family first to view members
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Family Members</Label>
        {loading ? null : (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={refreshFamilyMembers}
            disabled={loading}
          >
            Refresh
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading family members...</span>
          </div>
        ) : (
          familyMembers.length > 0 ? (
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
          ) : (
            <p className="text-sm text-muted-foreground p-2">No family members found</p>
          )
        )}
      </div>
      
      {error && (
        <div className="p-2 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={refreshFamilyMembers}
            disabled={loading}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
