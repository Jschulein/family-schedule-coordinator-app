
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
  const { events, setEvents, loading, error, offlineMode, refetchEvents } = useEventData();

  const addEvent = async (newEvent: Event): Promise<Event | undefined> => {
    try {
      // Check if we're in offline mode
      if (offlineMode) {
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Changes will be saved when you reconnect.",
          variant: "destructive"
        });
        return undefined;
      }
      
      console.log("Adding event:", newEvent);
      const { event: createdEvent, error: addError } = await addEventFn(newEvent);
      
      if (addError) {
        console.error("Error adding event:", addError);
        toast({
          title: "Error",
          description: addError,
          variant: "destructive"
        });
        return undefined;
      }
      
      if (createdEvent) {
        // Update the local state optimistically
        setEvents(prevEvents => [...prevEvents, createdEvent]);
        
        toast({
          title: "Success",
          description: "Event created successfully!"
        });
        
        // Refresh events to ensure we have all the latest data including family associations
        console.log("Refreshing events after creation to get latest data");
        try {
          await refetchEvents(false);
        } catch (refreshError) {
          console.warn("Non-critical error refreshing events after creation:", refreshError);
        }
        return createdEvent; // Return the created event for chaining
      }
      
      console.warn("No event was created and no error was returned");
      return undefined;
    } catch (error: any) {
      console.error("Error in addEvent:", error);
      handleError(error, {
        context: "Adding event", 
        title: "Error",
        showToast: true
      });
      return undefined; // Return undefined on error
    }
  };

  const updateEvent = async (updatedEvent: Event): Promise<Event | undefined> => {
    try {
      // Check if we're in offline mode
      if (offlineMode) {
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Changes will be saved when you reconnect.",
          variant: "destructive"
        });
        return undefined;
      }
      
      console.log("Updating event:", updatedEvent);
      const { event: eventResult, error: updateError } = await updateEventFn(updatedEvent);
      
      if (updateError) {
        console.error("Error updating event:", updateError);
        toast({
          title: "Error",
          description: updateError,
          variant: "destructive"
        });
        return undefined;
      }
      
      if (eventResult) {
        // Update local state optimistically
        setEvents(prevEvents => prevEvents.map(event => 
          event.id === updatedEvent.id ? eventResult : event
        ));
        
        toast({
          title: "Success", 
          description: "Event updated successfully!"
        });
        
        // Refresh events to ensure we have all the latest data
        try {
          await refetchEvents(false);
        } catch (refreshError) {
          console.warn("Non-critical error refreshing events after update:", refreshError);
        }
        return eventResult;
      }
      
      console.warn("No event was updated and no error was returned");
      return undefined;
    } catch (error: any) {
      console.error("Error in updateEvent:", error);
      handleError(error, {
        context: "Updating event", 
        title: "Error",
        showToast: true
      });
      return undefined;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      // Check if we're in offline mode
      if (offlineMode) {
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Changes will be saved when you reconnect.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log("Deleting event:", eventId);
      const { success, message, error: deleteError } = await deleteEventFn(eventId);
      
      if (deleteError) {
        console.error("Error deleting event:", deleteError);
        toast({
          title: "Error",
          description: deleteError,
          variant: "destructive"
        });
        return false;
      }
      
      if (success) {
        // Update local state by removing the deleted event
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        
        toast({
          title: "Success",
          description: message || "Event deleted successfully!"
        });
        
        return true;
      }
      
      console.warn("Event deletion not successful and no error was returned");
      return false;
    } catch (error: any) {
      console.error("Error in deleteEvent:", error);
      handleError(error, {
        context: "Deleting event", 
        title: "Error",
        showToast: true
      });
      return false;
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
        offlineMode,
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
