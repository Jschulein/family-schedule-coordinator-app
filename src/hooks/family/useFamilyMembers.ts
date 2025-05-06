
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FamilyMember } from "@/types/familyTypes";
import { getFamilyMembers } from "@/services/families/simplifiedFamilyService";

/**
 * Custom hook for fetching and managing family members data
 * Optimized with caching, loading states, and realtime updates
 * @param familyId Optional family ID to filter members
 * @returns Family members data and loading/error states
 */
export const useFamilyMembers = (familyId?: string) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Memoized loading function to prevent unnecessary rerenders
  const loadFamilyMembers = useCallback(async () => {
    // Don't fetch again if we're already loading
    if (loading || !familyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching family members data...");
      const result = await getFamilyMembers(familyId);
      
      if (result.error) {
        setError(result.error || "Failed to load family members");
        toast({ 
          title: "Error", 
          description: "Failed to load family members" 
        });
      } else if (result.data) {
        console.log(`Loaded ${result.data.length} family members`);
        setFamilyMembers(result.data);
      } else {
        // Handle case where no data was returned but no error either
        setFamilyMembers([]);
      }
    } catch (e: any) {
      console.error("Unexpected error in useFamilyMembers hook:", e);
      setError("An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred while loading family members" 
      });
    } finally {
      setLoading(false);
    }
  }, [loading, familyId]);

  // Initial load
  useEffect(() => {
    if (familyId) {
      loadFamilyMembers();
    } else {
      setFamilyMembers([]);
    }
    
    // Set up subscription for realtime updates to family_members table
    let channel: any = null;
    
    if (familyId) {
      channel = supabase
        .channel('family-member-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'family_members', filter: `family_id=eq.${familyId}` }, 
          () => {
            console.log('Family member changes detected, refreshing data');
            loadFamilyMembers();
          }
        )
        .subscribe();
    }
      
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadFamilyMembers, familyId]);

  return {
    familyMembers,
    loading,
    error,
    refreshFamilyMembers: loadFamilyMembers
  };
};
