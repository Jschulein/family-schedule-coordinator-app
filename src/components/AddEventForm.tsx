
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
import { EventFamilyMembersInput } from './events/EventFamilyMembersInput';
import { supabase } from "@/integrations/supabase/client";

// Update interface to match the EventContext interface
interface Event {
  name: string;
  date: Date;
  description: string;
  creatorId: string;
  familyMembers: string[];
}

const AddEventForm = ({ onSubmit }: { onSubmit: (event: Event) => void }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState('');
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && date && familyMembers.length > 0) {
      // Get the current user's ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;
      
      if (userId) {
        onSubmit({ 
          name, 
          date, 
          description, 
          creatorId: userId,
          familyMembers 
        });
        
        setName('');
        setDate(undefined);
        setDescription('');
        setFamilyMembers([]);
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
            disabled={!name || !date || familyMembers.length === 0}
          >
            Add Event
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddEventForm;
