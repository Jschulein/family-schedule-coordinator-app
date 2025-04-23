
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

// Extend Event to give clarity
export interface Event {
  name: string;
  date: Date;
  description: string;
  familyMember: string; // will now be resolved from profile/user
  creatorId: string; // add this for explicit mapping
}

// Optional profiling interface
interface UserProfile {
  id: string;
  full_name?: string | null;
  Email?: string | null;
  // add more fields as needed
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
  function fromDbEvent(row: any, userMap: Record<string, UserProfile | undefined>): Event {
    const userProfile = userMap[row.creator_id];
    const familyMember =
      userProfile?.full_name ||
      userProfile?.Email ||
      row.creator_id?.slice(0, 8) || // fallback: truncated uuid
      "Unknown";
    return {
      name: row.name,
      date: new Date(row.date),
      description: row.description ?? "",
      familyMember,
      creatorId: row.creator_id,
    };
  }

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      // First, fetch events with creator_id
      const { data: eventRows, error: eventError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventError) {
        setError("Failed to load events");
        toast.error("Unable to fetch events from server.");
        setLoading(false);
        return;
      }

      // Now, fetch user profiles by creator_id (if any events exist)
      const creatorIds = Array.from(new Set((eventRows || []).map((row: any) => row.creator_id))).filter(Boolean);
      let userMap: Record<string, UserProfile | undefined> = {};

      if (creatorIds.length > 0) {
        // Try profiles table first
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, Email')
          .in('id', creatorIds);

        if (profiles) {
          profiles.forEach((profile: UserProfile) => {
            userMap[profile.id] = profile;
          });
        }
      }

      const mappedEvents = (eventRows || []).map((row: any) => fromDbEvent(row, userMap));
      setEvents(mappedEvents);
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
          creator_id: newEvent.creatorId,
        },
      ]);

    if (error) {
      setError("Failed to add event");
      toast.error("Unable to add event.");
      setLoading(false);
      return;
    }

    // Optimistically update state
    setEvents(prevEvents => [...prevEvents, { ...newEvent }]);
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

