
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface EventNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const EventNameInput = ({ value, onChange }: EventNameInputProps) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (value.trim() === "") {
      setError(null);
    } else if (value.length < 3) {
      setError("Event name must be at least 3 characters long");
    } else {
      setError(null);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="name">Event Name</Label>
      <Input
        id="name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Birthday Party"
        required
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
