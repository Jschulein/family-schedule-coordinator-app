
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
import { EventDescriptionInput } from './events/EventDescriptionInput';
import { EventFamilyMemberInput } from './events/EventFamilyMemberInput';

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
          <EventNameInput 
            value={name} 
            onChange={setName} 
          />
          <EventDateInput 
            value={date} 
            onSelect={setDate} 
          />
          <EventDescriptionInput 
            value={description} 
            onChange={setDescription} 
          />
          <EventFamilyMemberInput 
            value={familyMember} 
            onChange={setFamilyMember} 
          />
          <Button type="submit" className="w-full">Add Event</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddEventForm;
