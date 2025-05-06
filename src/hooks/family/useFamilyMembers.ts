
import { useState, useEffect, useCallback } from "react";
import { FamilyMember } from "@/types/familyTypes";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "./useFamilyContext";
import { callWithFallback, directTableQuery } from "@/services/events/helpers/databaseUtils";

/**
 * Custom hook for fetching and managing family members data
 * Enhanced with caching, retry logic, and offline support
 * @returns Family members data and loading/error states
 */
export const useFamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { activeFamilyId } = useFamilyContext();
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Cache key based on active family
  const cacheKey = `familyMembers_${activeFamilyId || 'none'}`;

  // Load from cache on initial mount
  useEffect(() => {
    if (!activeFamilyId) return;
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { members, timestamp } = JSON.parse(cachedData);
        
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 300000) {
          setFamilyMembers(members);
          console.log(`Loaded ${members.length} family members from cache`);
        }
      }
    } catch (e) {
      console.error("Failed to load cached family members:", e);
    }
  }, [activeFamilyId, cacheKey]);

  // Memoized loading function with retry logic
  const loadFamilyMembers = useCallback(async () => {
    // Don't fetch if no active family
    if (!activeFamilyId) {
      setFamilyMembers([]);
      setError(null);
      setLoading(false);
      return;
    }
    
    // Don't show loading if we're retrying and already have data
    if (retryCount === 0 || familyMembers.length === 0) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      console.log(`Fetching members for family: ${activeFamilyId}, attempt ${retryCount + 1}`);
      
      // Try using our secured functions first
      const { data, error: fetchError } = await callWithFallback(
        'get_family_members_by_family_id',
        'get_all_family_members_for_user_safe',
        { p_family_id: activeFamilyId }
      );
      
      if (fetchError || !data) {
        console.error("Error fetching family members:", fetchError);
        
        // If we still have retries left, try direct query
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          
          // Try direct table query as last resort
          const { data: directData, error: directError } = await directTableQuery('family_members', {
            select: '*',
            filter: { family_id: activeFamilyId }
          });
          
          if (directError || !directData) {
            console.error("Direct query also failed:", directError);
            
            if (retryCount === MAX_RETRIES - 1) {
              setError("Unable to load family members");
              toast({ 
                title: "Error", 
                description: "Failed to load family members" 
              });
            }
            return;
          }
          
          console.log(`Loaded ${directData.length} family members using direct query`);
          setFamilyMembers(directData as FamilyMember[]);
          setError(null);
          
          // Cache the data
          cacheResults(directData);
          setRetryCount(0);
          return;
        }
        
        setError("Failed to load family members");
        
        if (retryCount === MAX_RETRIES - 1) {
          toast({ 
            title: "Error", 
            description: "Unable to load family members. Please try again later." 
          });
        }
        
        return;
      }
      
      console.log(`Loaded ${data.length} family members`);
      setFamilyMembers(data as FamilyMember[]);
      setError(null);
      setRetryCount(0);
      
      // Cache the data
      cacheResults(data);
    } catch (e) {
      console.error("Unexpected error in useFamilyMembers hook:", e);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        setRetryCount(prev => prev + 1);
        // Try again with a slight delay
        setTimeout(() => {
          loadFamilyMembers();
        }, 1000);
        return;
      }
      
      setError("An unexpected error occurred");
      
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred while loading family members" 
      });
    } finally {
      setLoading(false);
    }
  }, [activeFamilyId, familyMembers.length, retryCount, cacheKey]);

  // Cache helper function
  const cacheResults = useCallback((data: any[]) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        members: data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error("Failed to cache family members:", e);
    }
  }, [cacheKey]);

  // Initial load when active family changes and reset retry count
  useEffect(() => {
    setRetryCount(0);
    
    if (activeFamilyId) {
      loadFamilyMembers();
    } else {
      // Clear members when no family is active
      setFamilyMembers([]);
    }
  }, [activeFamilyId, loadFamilyMembers]);

  // Reset function that clears errors and retry counts
  const refreshFamilyMembers = useCallback(() => {
    setRetryCount(0);
    return loadFamilyMembers();
  }, [loadFamilyMembers]);

  return {
    familyMembers,
    loading,
    error,
    refreshFamilyMembers
  };
};
