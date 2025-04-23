
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EventDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const EventDescriptionInput = ({ value, onChange }: EventDescriptionInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Event details..."
        required
      />
    </div>
  );
};
