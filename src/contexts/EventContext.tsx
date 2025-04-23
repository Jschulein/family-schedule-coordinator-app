
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export interface Event {
  name: string;
  date: Date;
  description: string;
  familyMember: string;
}

interface EventContextType {
  events: Event[];
  addEvent: (event: Event) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert from Supabase DB row to Event
  function fromDbEvent(row: any): Event {
    return {
      name: row.name,
      date: new Date(row.date),
      description: row.description ?? "",
      familyMember: row.creator_id ?? "Unknown", // This can be replaced with more meaningful data if you have member profiles
    };
  }

  // Fetch events from Supabase
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        setError("Failed to load events");
        toast.error("Unable to fetch events from server.");
        setLoading(false);
        return;
      }

      // Map DB rows to Event objects
      setEvents((data || []).map(fromDbEvent));
      setLoading(false);
    }

    fetchEvents();
  }, []);

  // Add event to Supabase
  const addEvent = async (newEvent: Event) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          name: newEvent.name,
          date: newEvent.date.toISOString(),
          description: newEvent.description,
          creator_id: newEvent.familyMember, // Still using familyMember field; you should wire to real user/family in further steps.
        },
      ]);

    if (error) {
      setError("Failed to add event");
      toast.error("Unable to add event.");
      setLoading(false);
      return;
    }

    // Optimistically update state (fetch again for 100% consistency could also be done)
    setEvents(prevEvents => [
      ...prevEvents,
      {
        ...newEvent,
      },
    ]);
    setLoading(false);
    toast.success("Event created successfully!");
  };

  return (
    <EventContext.Provider value={{ events, addEvent, loading, error }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}
