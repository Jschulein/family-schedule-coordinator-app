
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { FamilyMember } from "@/types/familyTypes";
import { useFamilyMembers } from "@/hooks/family/useFamilyMembers";
import { useEffect, useState } from "react";
import { useFamilyContext } from "@/hooks/family/useFamilyContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface EventFamilyMembersInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const EventFamilyMembersInput = ({ value, onChange }: EventFamilyMembersInputProps) => {
  const { activeFamilyId } = useFamilyContext();
  const { familyMembers, loading, error, refreshFamilyMembers } = useFamilyMembers();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refresh family members when the component mounts or active family changes
  useEffect(() => {
    if (activeFamilyId) {
      refreshFamilyMembers();
    }
  }, [activeFamilyId, refreshFamilyMembers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await refreshFamilyMembers();
    } catch (err) {
      console.error("Error refreshing family members:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

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
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
        >
          {isRefreshing || loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {loading && !isRefreshing ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading family members...</span>
          </div>
        ) : familyMembers.length > 0 ? (
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
          <div className="text-sm text-muted-foreground p-2">
            {error ? (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>No family members could be loaded. Please try refreshing.</span>
              </div>
            ) : (
              <p>No family members found</p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 text-sm text-amber-700 bg-amber-50 rounded-md border border-amber-200">
          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading family members</p>
              <p className="mt-1">{error}</p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Retry {retryCount > 0 ? `(${retryCount})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
