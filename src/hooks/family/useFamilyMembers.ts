
import { useState, useEffect, useCallback } from "react";
import { FamilyMember } from "@/types/familyTypes";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useFamilyContext } from "./useFamilyContext";

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
  const MAX_RETRIES = 2;

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
          // We'll still fetch fresh data, but we won't show a loading state
          // if we have recent cached data
        }
      }
    } catch (e) {
      console.error("Failed to load cached family members:", e);
    }
  }, [activeFamilyId, cacheKey]);

  // Memoized loading function with retry logic
  const loadFamilyMembers = useCallback(async () => {
    // Don't fetch if no active family
    if (!activeFamilyId) return;
    
    // Don't show loading if we're retrying and already have data
    if (retryCount === 0 || familyMembers.length === 0) {
      setLoading(true);
    }
    
    setError(null);
    
    try {
      console.log(`Fetching members for family: ${activeFamilyId}, attempt ${retryCount + 1}`);
      
      // Try to use the direct security definer function first
      const { data, error: fetchError } = await supabase
        .rpc('get_family_members_by_family_id', { 
          p_family_id: activeFamilyId
        });
      
      if (fetchError) {
        console.error("Error fetching family members:", fetchError);
        
        // If we have retries left, try a different approach
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          
          // Try alternative method - using the standard family_members query
          // with explicit RLS checking to avoid recursion
          const { data: altData, error: altError } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_id', activeFamilyId);
            
          if (altError) {
            console.error("Alternative fetch also failed:", altError);
            setError("Failed to load family members");
            
            // Return early but don't clear existing data
            return;
          }
          
          if (altData && altData.length > 0) {
            console.log(`Loaded ${altData.length} family members using alternative method`);
            setFamilyMembers(altData);
            setError(null);
            
            // Cache the data
            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                members: altData,
                timestamp: Date.now()
              }));
            } catch (e) {
              console.error("Failed to cache family members:", e);
            }
            
            return;
          }
        }
        
        setError("Failed to load family members");
        
        if (retryCount === MAX_RETRIES) {
          toast({ 
            title: "Error", 
            description: "Unable to load family members. Please try again later." 
          });
        }
        
        return;
      }
      
      if (data) {
        console.log(`Loaded ${data.length} family members`);
        setFamilyMembers(data);
        setError(null);
        setRetryCount(0); // Reset retry count on success
        
        // Cache the data
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            members: data,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error("Failed to cache family members:", e);
        }
      } else {
        setFamilyMembers([]);
      }
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
