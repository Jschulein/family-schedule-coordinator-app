
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

// Updated Event interface to align with form data
export interface Event {
  name: string;
  date: Date;
  description: string;
  familyMembers?: string[]; // Make this optional for existing events
  creatorId: string;
  familyMember?: string; // Keep this for backward compatibility
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

    try {
      // First insert the event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([
          {
            name: newEvent.name,
            date: newEvent.date.toISOString(),
            description: newEvent.description,
            creator_id: newEvent.creatorId,
          }
        ])
        .select()
        .single();
      
      if (eventError) throw eventError;
      
      // If we have family members, associate them with the event
      if (newEvent.familyMembers && newEvent.familyMembers.length > 0) {
        // Insert family member associations
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
          // We still created the event, so we won't throw here
        }
      }

      // Optimistically update state
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
