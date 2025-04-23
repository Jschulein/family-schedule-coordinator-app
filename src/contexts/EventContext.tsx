
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export interface Event {
  id?: string;
  name: string;
  date: Date;
  end_date?: Date;
  time: string;
  description: string;
  familyMembers?: string[];
  creatorId: string;
  familyMember?: string;
  all_day?: boolean;
}

interface UserProfile {
  id: string;
  full_name?: string | null;
  Email?: string | null;
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
      row.creator_id?.slice(0, 8) || 
      "Unknown";
    
    return {
      id: row.id,
      name: row.name,
      date: new Date(row.date),
      end_date: row.end_date ? new Date(row.end_date) : undefined,
      time: row.time,
      description: row.description ?? "",
      familyMember,
      creatorId: row.creator_id,
      all_day: row.all_day || false
    };
  }

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        const { data: eventRows, error: eventError } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });

        if (eventError) {
          console.error("Error fetching events:", eventError);
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
      } catch (e) {
        console.error("Error in fetchEvents:", e);
        setError("An unexpected error occurred");
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const addEvent = async (newEvent: Event) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Adding event:", newEvent);
      
      // Prepare the data object for insertion
      const eventData = {
        name: newEvent.name,
        date: newEvent.date.toISOString().split('T')[0],
        end_date: newEvent.end_date ? newEvent.end_date.toISOString().split('T')[0] : newEvent.date.toISOString().split('T')[0],
        time: newEvent.time,
        description: newEvent.description || "",
        creator_id: newEvent.creatorId,
        all_day: newEvent.all_day || false
      };
      
      console.log("Event data for insert:", eventData);
      
      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();
      
      if (eventError) {
        console.error("Error adding event:", eventError);
        toast.error("Failed to add event: " + eventError.message);
        setError("Failed to add event: " + eventError.message);
        return;
      }
      
      console.log("Event created successfully:", eventResult);
      
      if (newEvent.familyMembers && newEvent.familyMembers.length > 0 && eventResult) {
        const familyMemberAssociations = newEvent.familyMembers.map(memberId => ({
          event_id: eventResult.id,
          family_id: memberId,
          shared_by: newEvent.creatorId
        }));
        
        console.log("Associating with family members:", familyMemberAssociations);
        
        const { error: associationError } = await supabase
          .from('event_families')
          .insert(familyMemberAssociations);
          
        if (associationError) {
          console.error("Error associating family members:", associationError);
          toast.warning("Event created but failed to associate with family members");
        }
      }

      // Create a complete event object with the returned data for the UI
      const createdEvent = {
        ...newEvent,
        id: eventResult?.id
      };
      
      setEvents(prevEvents => [...prevEvents, createdEvent]);
      toast.success("Event created successfully!");
      
    } catch (error: any) {
      console.error("Error adding event:", error);
      setError("Failed to add event: " + (error.message || "Unknown error"));
      toast.error("Failed to add event: " + (error.message || "Unknown error"));
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
