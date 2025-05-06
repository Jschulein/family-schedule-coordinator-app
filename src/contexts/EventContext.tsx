
import { createContext, useContext, ReactNode } from 'react';
import { toast } from "@/components/ui/use-toast";
import { 
  addEventToDb as addEventFn, 
  updateEventInDb as updateEventFn, 
  deleteEventFromDb as deleteEventFn 
} from '@/services/events';
import type { Event, EventContextType } from '@/types/eventTypes';
import { handleError } from '@/utils/error';
import { useEventData } from '@/hooks/useEventData';

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const { events, setEvents, loading, error, refetchEvents } = useEventData();

  const addEvent = async (newEvent: Event) => {
    try {
      const { event: createdEvent, error: addError } = await addEventFn(newEvent);
      
      if (addError) {
        toast({
          title: "Error",
          description: addError,
          variant: "destructive"
        });
        return;
      }
      
      if (createdEvent) {
        setEvents(prevEvents => [...prevEvents, createdEvent]);
        toast({
          title: "Success",
          description: "Event created successfully!"
        });
        
        // Refresh events to ensure we have all the latest data
        refetchEvents(false);
      }
    } catch (error: any) {
      console.error("Error in addEvent:", error);
      handleError(error, {
        context: "Adding event", 
        title: "Error",
        showToast: true
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
          event.id === updatedEvent.id ? eventResult : event
        ));
        toast({
          title: "Success", 
          description: "Event updated successfully!"
        });
      }
    } catch (error: any) {
      console.error("Error in updateEvent:", error);
      handleError(error, {
        context: "Updating event", 
        title: "Error",
        showToast: true
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
      handleError(error, {
        context: "Deleting event", 
        title: "Error",
        showToast: true
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
