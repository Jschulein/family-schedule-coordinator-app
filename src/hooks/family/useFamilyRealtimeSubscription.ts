
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook for subscribing to real-time family changes
 */
export function useFamilyRealtimeSubscription(onDataChange: () => void) {
  // Set up realtime subscription for family changes
  useEffect(() => {
    console.log("Setting up realtime subscription for family changes");
    
    const channel = supabase
      .channel('family-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'families' }, 
        () => {
          console.log('Family changes detected, refreshing data');
          onDataChange();
        }
      )
      .subscribe();
      
    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [onDataChange]);
}
