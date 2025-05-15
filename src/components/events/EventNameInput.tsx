
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const EventNameInput = ({ value, onChange }: EventNameInputProps) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [valid, setValid] = useState(false);
  
  useEffect(() => {
    // Only validate after the field has been touched or if there's a value
    if (!touched && value.trim() === "") {
      setError(null);
      setValid(false);
      return;
    }
    
    if (value.trim() === "") {
      setError("Event name is required");
      setValid(false);
    } else if (value.length < 3) {
      setError("Event name must be at least 3 characters long");
      setValid(false);
    } else {
      setError(null);
      setValid(true);
    }
  }, [value, touched]);

  return (
    <div className="space-y-2">
      <Label htmlFor="event-name" className="flex justify-between">
        <span>Event Name</span>
        {touched && (
          <span className="text-xs">
            {valid && <Check className="h-4 w-4 inline text-green-500" />}
            {error && <span className="text-red-500">{value.length}/3+ chars</span>}
          </span>
        )}
      </Label>
      <div className="relative">
        <Input
          id="event-name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Birthday Party, Doctor's Appointment, etc."
          required
          className={cn(
            touched && error ? "border-red-500 pr-10" : "",
            touched && valid ? "border-green-500 pr-10" : ""
          )}
          aria-invalid={touched && !!error}
          aria-describedby={error ? "name-error" : undefined}
        />
        {touched && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {valid && <Check className="h-4 w-4 text-green-500" />}
            {error && <AlertCircle className="h-4 w-4 text-red-500" />}
          </div>
        )}
      </div>
      {touched && error && (
        <p id="name-error" className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};
