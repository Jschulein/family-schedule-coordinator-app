
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventFamilyMemberInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const EventFamilyMemberInput = ({ value, onChange }: EventFamilyMemberInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="familyMember">Family Member</Label>
      <Input
        id="familyMember"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your name"
        required
      />
    </div>
  );
};
