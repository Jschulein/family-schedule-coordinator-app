
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Custom hook for subscribing to real-time family changes
 * with improved error handling and reconnection logic
 */
export function useFamilyRealtimeSubscription(onDataChange: () => void) {
  const channelRef = useRef<any>(null);
  const reconnectCountRef = useRef(0);
  const maxReconnects = 5;

  const setupSubscription = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    console.log("Setting up realtime subscription for family changes");
    
    try {
      channelRef.current = supabase
        .channel('family-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'families' }, 
          () => {
            console.log('Family changes detected, refreshing data');
            onDataChange();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'family_members' },
          () => {
            console.log('Family member changes detected, refreshing data');
            onDataChange();
          }
        )
        .on('system', { event: 'reconnected' }, () => {
          console.log('Realtime connection reestablished, refreshing data');
          onDataChange();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log("Successfully subscribed to family changes");
            reconnectCountRef.current = 0;
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            console.error(`Subscription error: ${status}`);
            handleSubscriptionError();
          }
        });
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
      handleSubscriptionError();
    }
  }, [onDataChange]);

  const handleSubscriptionError = useCallback(() => {
    if (reconnectCountRef.current < maxReconnects) {
      reconnectCountRef.current++;
      const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000); // Exponential backoff with max 30s
      
      console.log(`Attempting to reconnect in ${delay/1000}s (attempt ${reconnectCountRef.current}/${maxReconnects})...`);
      
      setTimeout(() => {
        setupSubscription();
      }, delay);
    } else {
      toast({
        title: "Connection Issue",
        description: "Realtime updates are currently unavailable. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [setupSubscription]);
  
  // Set up realtime subscription for family changes
  useEffect(() => {
    setupSubscription();
    
    return () => {
      console.log("Cleaning up realtime subscription");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [setupSubscription]);
}
