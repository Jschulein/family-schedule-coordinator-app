
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface EventTimeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const EventTimeInput = ({ value, onChange }: EventTimeInputProps) => {
  return (
    <div className="space-y-2">
      <Label>Time</Label>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
};
