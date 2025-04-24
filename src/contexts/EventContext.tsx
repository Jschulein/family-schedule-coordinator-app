
import { createContext, useContext, ReactNode } from 'react';
import { Event, EventContextType } from '@/types/eventTypes';
import { useEventData } from '@/hooks/useEventData';
import { addEventToDb, updateEventInDb, deleteEventFromDb } from '@/services/eventService';
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

  const updateEvent = async (updatedEvent: Event) => {
    try {
      const { event: eventResult, error: updateError } = await updateEventInDb(updatedEvent);
      
      if (updateError) {
        toast.error(updateError);
        return;
      }
      
      if (eventResult) {
        setEvents(prevEvents => prevEvents.map(event => 
          event.id === updatedEvent.id ? {...updatedEvent, id: event.id} : event
        ));
        toast.success("Event updated successfully!");
      }
    } catch (error: any) {
      console.error("Error in updateEvent:", error);
      toast.error("Failed to update event: " + (error.message || "Unknown error"));
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { success, message, error: deleteError } = await deleteEventFromDb(eventId);
      
      if (deleteError) {
        toast.error(deleteError);
        return;
      }
      
      if (success) {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        toast.success(message || "Event deleted successfully!");
      }
    } catch (error: any) {
      console.error("Error in deleteEvent:", error);
      toast.error("Failed to delete event: " + (error.message || "Unknown error"));
    }
  };

  return (
    <EventContext.Provider 
      value={{ 
        events, 
        addEvent, 
        updateEvent, 
        deleteEvent, 
        loading, 
        error, 
        refetchEvents 
      }}
    >
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
