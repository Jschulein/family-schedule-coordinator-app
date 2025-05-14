
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

  const addEvent = async (newEvent: Event) => {
    try {
      // Check if we're in offline mode
      if (offlineMode) {
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Changes will be saved when you reconnect.",
          variant: "destructive"
        });
        return;
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
        return;
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
        await refetchEvents(false);
        return createdEvent; // Return the created event for chaining
      }
    } catch (error: any) {
      console.error("Error in addEvent:", error);
      handleError(error, {
        context: "Adding event", 
        title: "Error",
        showToast: true
      });
      throw error; // Re-throw to allow the UI to handle it
    }
  };

  const updateEvent = async (updatedEvent: Event) => {
    try {
      // Check if we're in offline mode
      if (offlineMode) {
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Changes will be saved when you reconnect.",
          variant: "destructive"
        });
        return;
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
        return;
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
        await refetchEvents(false);
        return eventResult;
      }
    } catch (error: any) {
      console.error("Error in updateEvent:", error);
      handleError(error, {
        context: "Updating event", 
        title: "Error",
        showToast: true
      });
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      // Check if we're in offline mode
      if (offlineMode) {
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Changes will be saved when you reconnect.",
          variant: "destructive"
        });
        return;
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
        return;
      }
      
      if (success) {
        // Update local state by removing the deleted event
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        
        toast({
          title: "Success",
          description: message || "Event deleted successfully!"
        });
        
        return { success };
      }
    } catch (error: any) {
      console.error("Error in deleteEvent:", error);
      handleError(error, {
        context: "Deleting event", 
        title: "Error",
        showToast: true
      });
      throw error;
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
