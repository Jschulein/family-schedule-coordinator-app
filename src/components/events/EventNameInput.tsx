
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EventNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const EventNameInput = ({ value, onChange }: EventNameInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="name">Event Name</Label>
      <Input
        id="name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Birthday Party"
        required
      />
    </div>
  );
};
