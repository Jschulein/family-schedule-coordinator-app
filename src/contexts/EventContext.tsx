
import { createContext, useContext, ReactNode } from 'react';
import { Event, EventContextType } from '@/types/eventTypes';
import { useEventData } from '@/hooks/useEventData';
import { addEventToDb } from '@/services/eventService';
import { toast } from "@/components/ui/sonner";

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const { events, setEvents, loading, error, refetchEvents } = useEventData();

  const addEvent = async (newEvent: Event) => {
    try {
      const { event: createdEvent, error: addError } = await addEventToDb(newEvent);
      
      if (addError) {
        toast.error(addError);
        return;
      }
      
      if (createdEvent) {
        setEvents(prevEvents => [...prevEvents, createdEvent]);
        toast.success("Event created successfully!");
      }
    } catch (error: any) {
      console.error("Error in addEvent:", error);
      toast.error("Failed to add event: " + (error.message || "Unknown error"));
    }
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
