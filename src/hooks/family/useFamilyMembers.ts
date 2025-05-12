
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FamilyMember } from "@/types/familyTypes";
import { getFamilyMembers } from "@/services/families/simplifiedFamilyService";

type FamilyMembersHookOptions = {
  familyId?: string;
  enableRealtime?: boolean;
  enableCache?: boolean;
  cacheTimeout?: number;
};

/**
 * Custom hook for fetching and managing family members data
 * @param options Configuration options
 * @returns Family members data and utility functions
 */
export const useFamilyMembers = ({
  familyId,
  enableRealtime = true,
  enableCache = true,
  cacheTimeout = 300000  // 5 minutes default cache
}: FamilyMembersHookOptions = {}) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Cache key based on family ID
  const cacheKey = `familyMembers_${familyId || 'all'}`;

  // Load cached data on mount
  useEffect(() => {
    if (!enableCache) return;
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { members, timestamp } = JSON.parse(cachedData);
        
        // Use cache if less than configured timeout
        if (Date.now() - timestamp < cacheTimeout) {
          setFamilyMembers(members);
          console.log(`Loaded ${members.length} family members from cache`);
        }
      }
    } catch (e) {
      console.error("Failed to load cached family members:", e);
    }
  }, [cacheKey, enableCache, cacheTimeout]);

  // Memoized loading function to prevent unnecessary rerenders
  const loadFamilyMembers = useCallback(async () => {
    if (!familyId && !familyId === undefined) {
      setFamilyMembers([]);
      setLoading(false);
      return;
    }
    
    // Don't fetch again if we're already loading
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching family members for family ${familyId || 'all'}`);
      
      const result = await getFamilyMembers(familyId || '');
      
      if (result.isError) {
        setError(result.error || "Failed to load family members");
        toast({ 
          title: "Error", 
          description: "Failed to load family members" 
        });
      } else if (result.data) {
        console.log(`Loaded ${result.data.length} family members`);
        setFamilyMembers(result.data);
        
        // Cache the results if enabled
        if (enableCache) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              members: result.data,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error("Failed to cache family members:", e);
          }
        }
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
  }, [loading, familyId, cacheKey, enableCache]);

  // Initial load
  useEffect(() => {
    loadFamilyMembers();
  }, [loadFamilyMembers]);

  // Set up subscription for realtime updates if enabled
  useEffect(() => {
    if (!enableRealtime || !familyId) return;
    
    const channel = supabase
      .channel('family-member-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'family_members',
          filter: familyId ? `family_id=eq.${familyId}` : undefined 
        }, 
        () => {
          console.log('Family member changes detected, refreshing data');
          loadFamilyMembers();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, familyId, loadFamilyMembers]);

  return {
    familyMembers,
    loading,
    error,
    refreshFamilyMembers: loadFamilyMembers
  };
};
