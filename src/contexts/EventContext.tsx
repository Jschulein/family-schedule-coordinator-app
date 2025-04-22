
import { createContext, useContext, useState, ReactNode } from 'react';

export interface Event {
  name: string;
  date: Date;
  description: string;
  familyMember: string;
}

interface EventContextType {
  events: Event[];
  addEvent: (event: Event) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([
    {
      name: "Family Dinner",
      date: new Date(2024, 3, 15),
      description: "Weekly family dinner",
      familyMember: "Mom"
    },
    {
      name: "Soccer Practice",
      date: new Date(2024, 3, 20),
      description: "Jimmy's soccer practice",
      familyMember: "Jimmy"
    }
  ]);

  const addEvent = (newEvent: Event) => {
    setEvents(prevEvents => [...prevEvents, newEvent]);
  };

  return (
    <EventContext.Provider value={{ events, addEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}

