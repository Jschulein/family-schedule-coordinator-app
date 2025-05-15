
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { logEventFlow } from "@/utils/events";
import { performanceTracker } from "@/utils/testing/performanceTracker";

/**
 * Custom hook for handling event data refresh operations
 * @param refetchEvents Function to refresh event data
 * @returns States and handler for refreshing events
 */
export function useRefreshEvents(refetchEvents: (showToast?: boolean) => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle manual data refresh
   * Shows user feedback and manages refresh state
   */
  const handleRetry = async () => {
    // Skip if already refreshing
    if (isRefreshing) return;
    
    // Handle data refresh with performance tracking
    const refreshTrackingId = performanceTracker.startMeasure('NewEventPage:dataRefresh');
    
    setIsRefreshing(true);
    setError(null);
    logEventFlow('NewEvent', 'Manual data refresh requested');
    
    try {
      await refetchEvents(true);
      
      toast({
        title: "Success",
        description: "Data refreshed successfully",
        variant: "default"
      });
    } catch (error: any) {
      logEventFlow('NewEvent', 'Error refreshing data', error);
      setError(error?.message || "Failed to refresh data");
      
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      performanceTracker.endMeasure(refreshTrackingId);
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    error,
    setError,
    handleRetry
  };
}
