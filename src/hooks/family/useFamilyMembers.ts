
import { useState, useEffect, useCallback } from "react";
import { fetchFamilyMembers } from "@/services/families";
import { FamilyMember } from "@/services/families/types";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MemberManagementResult } from "./types";

/**
 * Custom hook for fetching and managing family members data
 * Optimized with caching, loading states, and realtime updates
 * @returns Family members data and loading/error states
 */
export const useFamilyMembers = (): MemberManagementResult => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Memoized loading function to prevent unnecessary rerenders
  const loadFamilyMembers = useCallback(async () => {
    // Don't fetch again if we're already loading
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching family members data...");
      const result = await fetchFamilyMembers();
      
      if (result.isError) {
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
    } catch (e) {
      console.error("Unexpected error in useFamilyMembers hook:", e);
      setError("An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred while loading family members" 
      });
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    loadFamilyMembers();
    
    // Set up subscription for realtime updates to family_members table
    const channel = supabase
      .channel('family-member-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'family_members' }, 
        () => {
          console.log('Family member changes detected, refreshing data');
          loadFamilyMembers();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFamilyMembers]);

  return {
    members: familyMembers,
    loading,
    error,
    refreshMembers: loadFamilyMembers
  };
};
