
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EventNameInput } from './events/EventNameInput';
import { EventDateInput } from './events/EventDateInput';
import { EventTimeInput } from './events/EventTimeInput';
import { EventDescriptionInput } from './events/EventDescriptionInput';
import { EventFamilyMembersInput } from './events/EventFamilyMembersInput';
import { EventEndDateInput } from './events/EventEndDateInput';
import { EventAllDayToggle } from './events/EventAllDayToggle';
import { supabase } from "@/integrations/supabase/client";

interface Event {
  name: string;
  date: Date;
  end_date?: Date;
  time: string;
  description: string;
  creatorId: string;
  familyMembers: string[];
  all_day: boolean;
}

const AddEventForm = ({ onSubmit }: { onSubmit: (event: Event) => void }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [time, setTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [allDay, setAllDay] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && date) {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      
      if (userId) {
        onSubmit({ 
          name, 
          date, 
          end_date: endDate || date,
          time,
          description, 
          creatorId: userId,
          familyMembers,
          all_day: allDay
        });
        
        setName('');
        setDate(undefined);
        setEndDate(undefined);
        setTime('12:00');
        setDescription('');
        setFamilyMembers([]);
        setAllDay(false);
      }
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
          <EventNameInput 
            value={name} 
            onChange={setName} 
          />
          <EventDateInput 
            value={date} 
            onSelect={setDate} 
          />
          <EventEndDateInput 
            value={endDate} 
            onSelect={setEndDate}
            startDate={date}
          />
          <EventAllDayToggle
            value={allDay}
            onChange={setAllDay}
          />
          {!allDay && (
            <EventTimeInput
              value={time}
              onChange={setTime}
            />
          )}
          <EventDescriptionInput 
            value={description} 
            onChange={setDescription} 
          />
          <EventFamilyMembersInput 
            value={familyMembers} 
            onChange={setFamilyMembers} 
          />
          <Button 
            type="submit" 
            className="w-full"
            disabled={!name || !date}
          >
            Add Event
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddEventForm;
