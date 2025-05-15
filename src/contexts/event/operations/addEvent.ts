
import { Event } from '@/types/eventTypes';
import { toast } from "@/components/ui/use-toast";
import { createEvent } from '@/services/events';
import { logEventFlow } from '@/utils/events';
import { handleError } from '@/utils/error';

/**
 * Add a new event to the database
 * @param events Current events array
 * @param setEvents Function to update events state
 * @param setOperationLoading Function to update loading state
 * @param offlineMode Whether the app is in offline mode
 * @param refetchEvents Function to refresh events data
 * @returns Function to add an event
 */
export function createAddEventOperation(
  events: Event[],
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
  setOperationLoading: (loading: boolean) => void,
  offlineMode: boolean,
  refetchEvents: (showToast?: boolean) => Promise<void>
) {
  /**
   * Add a new event
   * @param newEvent The event to add
   * @returns The created event or undefined if failed
   */
  return async (newEvent: Event): Promise<Event | undefined> => {
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
      
      // Set operation loading to true - form submission state is separate
      setOperationLoading(true);
      
      // Direct event creation - simplified approach
      const result = await createEvent(newEvent);
      
      if (!result.success) {
        logEventFlow('EventContext', 'Error creating event', result.error);
        toast({
          title: "Error",
          description: result.error || "Failed to create event",
          variant: "destructive"
        });
        setOperationLoading(false); // Reset loading state on error
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
      } finally {
        // Always reset operation loading when done, regardless of success/failure
        setOperationLoading(false);
      }
      
      return undefined;
    } catch (error: any) {
      logEventFlow('EventContext', 'Critical error in addEvent function', error);
      handleError(error, {
        context: "Adding event", 
        title: "Error",
        showToast: true
      });
      setOperationLoading(false); // Ensure loading state is reset even on critical errors
      return undefined;
    }
  };
}
