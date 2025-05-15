
import { Event } from '@/types/eventTypes';
import { toast } from "@/components/ui/use-toast";
import { updateEventInDb } from '@/services/events';
import { logEventFlow } from '@/utils/events';
import { handleError } from '@/utils/error';

/**
 * Create a function to update an existing event
 * @param setEvents Function to update events state
 * @param setOperationLoading Function to update loading state
 * @param offlineMode Whether the app is in offline mode
 * @param refetchEvents Function to refresh events data
 * @returns Function to update an event
 */
export function createUpdateEventOperation(
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
  setOperationLoading: (loading: boolean) => void,
  offlineMode: boolean,
  refetchEvents: (showToast?: boolean) => Promise<void>
) {
  /**
   * Update an existing event
   * @param updatedEvent The event with updated properties
   * @returns The updated event or undefined if failed
   */
  return async (updatedEvent: Event): Promise<Event | undefined> => {
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
      
      // Set operation loading to true
      setOperationLoading(true);
      
      console.log("Updating event:", updatedEvent);
      const { event: eventResult, error: updateError } = await updateEventInDb(updatedEvent);
      
      if (updateError) {
        console.error("Error updating event:", updateError);
        toast({
          title: "Error",
          description: updateError,
          variant: "destructive"
        });
        setOperationLoading(false); // Reset loading state on error
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
        
        setOperationLoading(false); // Reset loading state after success
        return eventResult;
      }
      
      console.warn("No event was updated and no error was returned");
      setOperationLoading(false); // Reset loading state if no update happened
      return undefined;
    } catch (error: any) {
      console.error("Error in updateEvent:", error);
      handleError(error, {
        context: "Updating event", 
        title: "Error",
        showToast: true
      });
      setOperationLoading(false); // Ensure loading state is reset even on critical errors
      return undefined;
    }
  };
}
