import { createContext, useContext, ReactNode } from 'react';
import { Event, EventContextType } from '@/types/eventTypes';
import { useEventData } from '@/hooks/useEventData';
import { 
  addEventToDb as addEventFn, 
  updateEventInDb as updateEventFn, 
  deleteEventFromDb as deleteEventFn 
} from '@/services/events';
import { toast } from "@/hooks/use-toast";

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const { events, setEvents, loading, error, refetchEvents } = useEventData();

  const addEvent = async (newEvent: Event) => {
    try {
      const { event: createdEvent, error: addError } = await addEventFn(newEvent);
      
      if (addError) {
        toast({
          title: "Error",
          description: addError
        });
        return;
      }
      
      if (createdEvent) {
        setEvents(prevEvents => [...prevEvents, createdEvent]);
        toast({
          title: "Success",
          description: "Event created successfully!"
        });
      }
    } catch (error: any) {
      console.error("Error in addEvent:", error);
      toast({
        title: "Error",
        description: "Failed to add event: " + (error.message || "Unknown error"),
        variant: "destructive"
      });
    }
  };

  const updateEvent = async (updatedEvent: Event) => {
    try {
      const { event: eventResult, error: updateError } = await updateEventFn(updatedEvent);
      
      if (updateError) {
        toast({
          title: "Error",
          description: updateError,
          variant: "destructive"
        });
        return;
      }
      
      if (eventResult) {
        setEvents(prevEvents => prevEvents.map(event => 
          event.id === updatedEvent.id ? {...updatedEvent, id: event.id} : event
        ));
        toast({
          title: "Success", 
          description: "Event updated successfully!"
        });
      }
    } catch (error: any) {
      console.error("Error in updateEvent:", error);
      toast({
        title: "Error",
        description: "Failed to update event: " + (error.message || "Unknown error"),
        variant: "destructive"
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { success, message, error: deleteError } = await deleteEventFn(eventId);
      
      if (deleteError) {
        toast({
          title: "Error",
          description: deleteError,
          variant: "destructive"
        });
        return;
      }
      
      if (success) {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        toast({
          title: "Success",
          description: message || "Event deleted successfully!"
        });
      }
    } catch (error: any) {
      console.error("Error in deleteEvent:", error);
      toast({
        title: "Error",
        description: "Failed to delete event: " + (error.message || "Unknown error"),
        variant: "destructive"
      });
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
