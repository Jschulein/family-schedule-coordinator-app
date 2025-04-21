
import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Event {
  name: string;
  date: Date;
  description: string;
  familyMember: string;
}

const AddEventForm = ({ onSubmit }: { onSubmit: (event: Event) => void }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState('');
  const [familyMember, setFamilyMember] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && date && description && familyMember) {
      onSubmit({ name, date, description, familyMember });
      setName('');
      setDate(undefined);
      setDescription('');
      setFamilyMember('');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add Family Event</CardTitle>
        <CardDescription>Schedule a new event for your family calendar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Birthday Party"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event details..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyMember">Family Member</Label>
            <Input
              id="familyMember"
              value={familyMember}
              onChange={(e) => setFamilyMember(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <Button type="submit" className="w-full">Add Event</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddEventForm;
