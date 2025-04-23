
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface EventDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const EventDescriptionInput = ({ value, onChange }: EventDescriptionInputProps) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (value.trim() !== "" && value.length < 5) {
      setError("Description should be at least 5 characters long");
    } else {
      setError(null);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Event details..."
        required
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
