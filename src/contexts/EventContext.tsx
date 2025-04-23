
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

// Test family of 5: Admin user + 4 members for dummy data testing
const DUMMY_EVENTS: Event[] = [
  {
    name: "Family Movie Night",
    date: new Date(2024, 3, 24),
    description: "Watch a film together. Snacks included!",
    familyMember: "Alex (Admin) - You", // Marked admin for clarity
  },
  {
    name: "Parent-Teacher Conference",
    date: new Date(2024, 3, 25),
    description: "Meet Ms. Smith to discuss progress.",
    familyMember: "Morgan",
  },
  {
    name: "Dance Class",
    date: new Date(2024, 3, 26),
    description: "Dress rehearsal for spring show.",
    familyMember: "Jamie",
  },
  {
    name: "Soccer Finals",
    date: new Date(2024, 3, 27),
    description: "Game vs Tigers at 5 PM.",
    familyMember: "Jordan",
  },
  {
    name: "Dentist Appointment",
    date: new Date(2024, 3, 28),
    description: "Bi-annual cleaning - don't forget!",
    familyMember: "Taylor",
  },
  {
    name: "Family Picnic",
    date: new Date(2024, 3, 29),
    description: "Picnic at Riverside Park. Bring lunch!",
    familyMember: "Alex (Admin) - You",
  },
  {
    name: "Piano Recital",
    date: new Date(2024, 4, 2),
    description: "Recital for Jamie's piano group.",
    familyMember: "Jamie",
  },
  {
    name: "Book Club",
    date: new Date(2024, 4, 4),
    description: "Monthly book club hosted by Morgan.",
    familyMember: "Morgan",
  },
  {
    name: "Field Trip",
    date: new Date(2024, 4, 6),
    description: "Jordan's class trip to science museum.",
    familyMember: "Jordan",
  },
  {
    name: "Art Show",
    date: new Date(2024, 4, 9),
    description: "Taylor's painting on display at school.",
    familyMember: "Taylor",
  },
];

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(DUMMY_EVENTS);

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

