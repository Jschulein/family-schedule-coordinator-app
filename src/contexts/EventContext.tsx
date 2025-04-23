import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export interface Event {
  name: string;
  date: Date;
  time: string;
  description: string;
  familyMembers?: string[]; // Made optional
  creatorId: string;
  familyMember?: string; // Keep this for backward compatibility
}

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
      time: row.time,
      description: row.description ?? "",
      familyMember,
      creatorId: row.creator_id,
    };
  }

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);

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

      const creatorIds = Array.from(new Set((eventRows || []).map((row: any) => row.creator_id))).filter(Boolean);
      let userMap: Record<string, UserProfile | undefined> = {};

      if (creatorIds.length > 0) {
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

  const addEvent = async (newEvent: Event) => {
    setLoading(true);
    setError(null);

    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([
          {
            name: newEvent.name,
            date: newEvent.date.toISOString(),
            time: newEvent.time,
            description: newEvent.description,
            creator_id: newEvent.creatorId,
          }
        ])
        .select()
        .single();
      
      if (eventError) throw eventError;
      
      if (newEvent.familyMembers && newEvent.familyMembers.length > 0) {
        const familyMemberAssociations = newEvent.familyMembers.map(memberId => ({
          event_id: eventData.id,
          family_id: memberId,
          shared_by: newEvent.creatorId
        }));
        
        const { error: associationError } = await supabase
          .from('event_families')
          .insert(familyMemberAssociations);
          
        if (associationError) {
          console.error("Error associating family members:", associationError);
        }
      }

      setEvents(prevEvents => [...prevEvents, { ...newEvent }]);
      
    } catch (error) {
      console.error("Error adding event:", error);
      setError("Failed to add event");
      throw error;
    } finally {
      setLoading(false);
    }
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
