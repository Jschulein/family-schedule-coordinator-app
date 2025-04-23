
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";

interface EventDateInputProps {
  value: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

export const EventDateInput = ({ value, onSelect }: EventDateInputProps) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!value) {
      setError(null);
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (value < today) {
      setError("Event date cannot be in the past");
    } else {
      setError(null);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label>Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onSelect}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
