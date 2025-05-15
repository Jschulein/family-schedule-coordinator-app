
import { Event } from '@/types/eventTypes';
import { toast } from "@/components/ui/use-toast";
import { deleteEventFromDb } from '@/services/events';
import { logEventFlow } from '@/utils/events';
import { handleError } from '@/utils/error';

/**
 * Create a function to delete an existing event
 * @param setEvents Function to update events state
 * @param setOperationLoading Function to update loading state
 * @param offlineMode Whether the app is in offline mode
 * @returns Function to delete an event
 */
export function createDeleteEventOperation(
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>,
  setOperationLoading: (loading: boolean) => void,
  offlineMode: boolean
) {
  /**
   * Delete an existing event
   * @param eventId The ID of the event to delete
   * @returns Boolean indicating success or failure
   */
  return async (eventId: string): Promise<boolean> => {
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
      
      // Set operation loading to true
      setOperationLoading(true);
      
      console.log("Deleting event:", eventId);
      const { success, message, error: deleteError } = await deleteEventFromDb(eventId);
      
      if (deleteError) {
        console.error("Error deleting event:", deleteError);
        toast({
          title: "Error",
          description: deleteError,
          variant: "destructive"
        });
        setOperationLoading(false); // Reset loading state on error
        return false;
      }
      
      if (success) {
        // Update local state by removing the deleted event
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
        
        toast({
          title: "Success",
          description: message || "Event deleted successfully!"
        });
        
        setOperationLoading(false); // Reset loading state after success
        return true;
      }
      
      console.warn("Event deletion not successful and no error was returned");
      setOperationLoading(false); // Reset loading state if no deletion happened
      return false;
    } catch (error: any) {
      console.error("Error in deleteEvent:", error);
      handleError(error, {
        context: "Deleting event", 
        title: "Error",
        showToast: true
      });
      setOperationLoading(false); // Ensure loading state is reset even on critical errors
      return false;
    }
  };
}
