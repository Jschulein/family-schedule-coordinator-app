
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface EventFamilyMemberInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const EventFamilyMemberInput = ({ value, onChange }: EventFamilyMemberInputProps) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (value.trim() === "") {
      setError(null);
    } else if (value.length < 2) {
      setError("Name must be at least 2 characters long");
    } else {
      setError(null);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="familyMember">Family Member</Label>
      <Input
        id="familyMember"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your name"
        required
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
