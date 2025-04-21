
import { useState } from "react";
import AddEventForm from "@/components/AddEventForm";
import EventCalendar from "@/components/EventCalendar";
import UpcomingEvents from "@/components/UpcomingEvents";

interface Event {
  name: string;
  date: Date;
  description: string;
  familyMember: string;
}

const Index = () => {
  const [events, setEvents] = useState<Event[]>([]);

  const handleAddEvent = (newEvent: Event) => {
    setEvents([...events, newEvent]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Family Schedule Coordinator
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AddEventForm onSubmit={handleAddEvent} />
            <UpcomingEvents events={events} />
          </div>
          <div>
            <EventCalendar events={events} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
