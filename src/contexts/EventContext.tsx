
import { createContext, useContext, ReactNode } from 'react';
import { toast } from "@/components/ui/use-toast";
import { 
  addEventToDb as addEventFn, 
  updateEventInDb as updateEventFn, 
  deleteEventFromDb as deleteEventFn,
  simpleAddEvent
} from '@/services/events';
import { fromDbEvent } from '@/utils/events/eventFormatter';
import { logEventFlow } from '@/utils/events';
import type { Event, EventContextType } from '@/types/eventTypes';
import { handleError } from '@/utils/error';
import { useEventData } from '@/hooks/useEventData';

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const { events, setEvents, loading, error, offlineMode, refetchEvents } = useEventData();

  const addEvent = async (newEvent: Event): Promise<Event | undefined> => {
    logEventFlow('EventContext', 'addEvent function called', newEvent);
    try {
      // Check if we're in offline mode
      if (offlineMode) {
        logEventFlow('EventContext', 'Offline mode detected, showing toast');
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Changes will be saved when you reconnect.",
          variant: "destructive"
        });
        return undefined;
      }
      
      logEventFlow('EventContext', 'Starting event creation process', { name: newEvent.name });
      
      // Set a timeout to ensure we don't wait forever
      let addEventPromiseCompleted = false;
      const timeoutId = setTimeout(() => {
        if (!addEventPromiseCompleted) {
          logEventFlow('EventContext', 'Event creation TIMED OUT', { name: newEvent.name });
          toast({
            title: "Operation timeout",
            description: "Event creation took too long. Please check if the event was created.",
            variant: "destructive"
          });
        }
      }, 10000);

      // First attempt using the simplified direct function for more reliable operation
      logEventFlow('EventContext', 'Trying simplified event creation first');
      const { event: simpleEvent, error: simpleError } = await simpleAddEvent(newEvent);
      
      // Mark promise as completed to prevent timeout message
      addEventPromiseCompleted = true;
      clearTimeout(timeoutId);
      
      if (simpleEvent) {
        logEventFlow('EventContext', 'Event created successfully with simplified function', simpleEvent);
        
        // Transform the database event to frontend format before adding to state
        const formattedEvent = fromDbEvent(simpleEvent);
        
        // Update the local state optimistically
        logEventFlow('EventContext', 'Updating local state with new event');
        setEvents(prevEvents => [...prevEvents, formattedEvent]);
        
        toast({
          title: "Success",
          description: "Event created successfully!"
        });
        
        // Refresh events to ensure we have all the latest data
        try {
          logEventFlow('EventContext', 'Refreshing events after successful creation');
          await refetchEvents(false);
        } catch (refreshError) {
          logEventFlow('EventContext', 'Non-critical error refreshing events', refreshError);
        }
        
        return formattedEvent;
      }
      
      if (simpleError) {
        logEventFlow('EventContext', 'Error with simplified event creation, falling back', simpleError);
        
        // Fall back to the original method as a backup
        const { event: createdEvent, error: addError } = await addEventFn(newEvent);
        
        if (addError) {
          logEventFlow('EventContext', 'Error adding event with standard method', addError);
          toast({
            title: "Error",
            description: addError,
            variant: "destructive"
          });
          return undefined;
        }
        
        if (createdEvent) {
          logEventFlow('EventContext', 'Event created successfully with fallback method', createdEvent);
          // Transform the database event to frontend format before adding to state
          const formattedEvent = fromDbEvent(createdEvent);
          
          // Update the local state optimistically
          setEvents(prevEvents => [...prevEvents, formattedEvent]);
          
          toast({
            title: "Success",
            description: "Event created successfully (using fallback method)!"
          });
          
          // Refresh events to ensure we have all the latest data
          try {
            await refetchEvents(false);
          } catch (refreshError) {
            logEventFlow('EventContext', 'Non-critical error refreshing events after fallback creation', refreshError);
          }
          
          return formattedEvent;
        }
      } else {
        logEventFlow('EventContext', 'Both event creation methods failed without providing error details');
        toast({
          title: "Error",
          description: "Failed to create event. Please try again later.",
          variant: "destructive"
        });
      }
      
      return undefined;
    } catch (error: any) {
      logEventFlow('EventContext', 'Critical error in addEvent function', error);
      handleError(error, {
        context: "Adding event", 
        title: "Error",
        showToast: true
      });
      return undefined;
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
