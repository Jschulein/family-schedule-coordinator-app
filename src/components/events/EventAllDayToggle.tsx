
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface EventAllDayToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const EventAllDayToggle = ({ value, onChange }: EventAllDayToggleProps) => {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="all-day">All Day Event</Label>
      <Switch
        id="all-day"
        checked={value}
        onCheckedChange={onChange}
      />
    </div>
  );
};
