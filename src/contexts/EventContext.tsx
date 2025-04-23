
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
  refetchEvents: () => Promise<void>;
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

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the current session to verify authentication
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log("No active session found");
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data: eventRows, error: eventError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventError) {
        console.error("Error fetching events:", eventError);
        setError(`Failed to load events: ${eventError.message}`);
        toast.error("Unable to fetch events from server.");
        setLoading(false);
        return;
      }

      const creatorIds = Array.from(new Set((eventRows || []).map((row: any) => row.creator_id))).filter(Boolean);
      let userMap: Record<string, UserProfile | undefined> = {};

      if (creatorIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, Email')
          .in('id', creatorIds);

        if (profileError) {
          console.error("Error fetching profiles:", profileError);
          // Continue with what we have - don't block event display due to profile errors
        }

        if (profiles) {
          profiles.forEach((profile: UserProfile) => {
            userMap[profile.id] = profile;
          });
        }
      }

      const mappedEvents = (eventRows || []).map((row: any) => fromDbEvent(row, userMap));
      setEvents(mappedEvents);
      if (mappedEvents.length === 0) {
        console.log("No events found");
      }
    } catch (e) {
      console.error("Error in fetchEvents:", e);
      setError("An unexpected error occurred");
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Set up a subscription for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchEvents();
      } else if (event === 'SIGNED_OUT') {
        setEvents([]);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const addEvent = async (newEvent: Event) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Adding event:", newEvent);
      
      // Verify user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to create events");
        setError("Authentication required");
        setLoading(false);
        return;
      }
      
      // Format dates for Supabase
      const eventData = {
        name: newEvent.name,
        date: newEvent.date.toISOString(),
        end_date: newEvent.end_date ? newEvent.end_date.toISOString() : newEvent.date.toISOString(),
        time: newEvent.time,
        description: newEvent.description || "",
        creator_id: session.user.id,
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
        toast.error(`Failed to add event: ${eventError.message}`);
        setError(`Failed to add event: ${eventError.message}`);
        return;
      }
      
      console.log("Event created successfully:", eventResult);
      
      if (newEvent.familyMembers && newEvent.familyMembers.length > 0 && eventResult) {
        const familyMemberAssociations = newEvent.familyMembers.map(memberId => ({
          event_id: eventResult.id,
          family_id: memberId,
          shared_by: session.user.id
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

      // Get the user profile for display
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, Email')
        .eq('id', session.user.id)
        .single();

      // Create a complete event object with the returned data for the UI
      const createdEvent: Event = {
        ...newEvent,
        id: eventResult?.id,
        creatorId: session.user.id,
        familyMember: profileData?.full_name || profileData?.Email || session.user.id.slice(0, 8) || "Unknown"
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

  const refetchEvents = async () => {
    await fetchEvents();
  };

  return (
    <EventContext.Provider value={{ events, addEvent, loading, error, refetchEvents }}>
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
