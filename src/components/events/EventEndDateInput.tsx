
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EventEndDateInputProps {
  value: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  startDate: Date | undefined;
}

export const EventEndDateInput = ({ value, onSelect, startDate }: EventEndDateInputProps) => {
  return (
    <div className="space-y-2">
      <Label>End Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal ${!value && "text-muted-foreground"}`}
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
            disabled={(date) => startDate ? date < startDate : false}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
