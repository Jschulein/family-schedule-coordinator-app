
import { createContext, useContext, ReactNode } from 'react';
import { toast } from "@/components/ui/use-toast";
import { 
  updateEventInDb as updateEventFn, 
  deleteEventFromDb as deleteEventFn,
  createEvent
} from '@/services/events';
import { fromDbEvent } from '@/utils/events';
import { logEventFlow } from '@/utils/events';
import type { Event, EventContextType } from '@/types/eventTypes';
import { handleError } from '@/utils/error';
import { useEventData } from '@/hooks/useEventData';

/**
 * Context for managing events throughout the application
 * Handles CRUD operations and manages loading states
 */
const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  // Use the enhanced useEventData hook with improved loading states
  const { 
    events, 
    setEvents, 
    loading,          // Kept for backward compatibility 
    initialLoading,   // Only true during first data load
    operationLoading, // True during data operations
    isRefreshing,     // True when refreshing existing data
    error, 
    offlineMode, 
    refetchEvents 
  } = useEventData();

  /**
   * Add a new event
   * @param newEvent The event to add
   * @returns The created event or undefined if failed
   */
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
      
      // Direct event creation - simplified approach
      const result = await createEvent(newEvent);
      
      if (!result.success) {
        logEventFlow('EventContext', 'Error creating event', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to create event",
          variant: "destructive"
        });
        return undefined;
      }
      
      logEventFlow('EventContext', 'Event created successfully', { id: result.eventId });
      
      // Get the latest events from database
      try {
        await refetchEvents(false);
        
        toast({
          title: "Success",
          description: "Event created successfully!"
        });
        
        // Find the newly created event in the refreshed list
        if (result.eventId) {
          const createdEvent = events.find(event => event.id === result.eventId);
          if (createdEvent) {
            return createdEvent;
          }
        }
      } catch (refreshError) {
        logEventFlow('EventContext', 'Non-critical error refreshing events', refreshError);
        
        // Create an optimistic event object to return
        const optimisticEvent: Event = {
          id: result.eventId,
          name: newEvent.name,
          date: newEvent.date,
          end_date: newEvent.end_date,
          time: newEvent.time,
          description: newEvent.description,
          creatorId: newEvent.creatorId,
          all_day: newEvent.all_day,
          familyMembers: newEvent.familyMembers
        };
        
        // Add to our local state
        setEvents(prevEvents => [...prevEvents, optimisticEvent]);
        
        return optimisticEvent;
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
        // Data
        events, 
        
        // Actions
        addEvent, 
        updateEvent, 
        deleteEvent, 
        refetchEvents,
        
        // Loading states - clearly named and exposed
        loading,          // Kept for backward compatibility
        initialLoading,   // Only true during first data load
        operationLoading, // True during data operations
        isRefreshing,     // True when refreshing existing data
        
        // Status
        error, 
        offlineMode
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
