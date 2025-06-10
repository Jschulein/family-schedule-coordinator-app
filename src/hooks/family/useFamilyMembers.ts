
import { useState, useEffect, useCallback } from "react";
import { FamilyMember } from "@/types/familyTypes";
import { toast } from "@/components/ui/use-toast";
import { useFamilyContext } from "@/contexts/family";
import { getFamilyMembers } from "@/services/families/simplifiedFamilyService";

/**
 * Consolidated hook for fetching and managing family members
 * Provides caching, loading states, and proper error handling
 */
export const useFamilyMembers = (familyId?: string | null) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { activeFamilyId } = useFamilyContext();
  
  // Use provided familyId or fall back to active family
  const targetFamilyId = familyId || activeFamilyId;
  
  // Cache key based on target family
  const cacheKey = `familyMembers_${targetFamilyId || 'none'}`;

  // Load cached data on mount
  useEffect(() => {
    if (!targetFamilyId) return;
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { members: cachedMembers, timestamp } = JSON.parse(cachedData);
        
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 300000) {
          setMembers(cachedMembers);
          console.log(`Loaded ${cachedMembers.length} family members from cache`);
        }
      }
    } catch (e) {
      console.error("Failed to load cached family members:", e);
    }
  }, [targetFamilyId, cacheKey]);

  // Memoized loading function
  const refetch = useCallback(async () => {
    // Don't fetch if no target family
    if (!targetFamilyId) {
      setMembers([]);
      setError(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const result = await getFamilyMembers(targetFamilyId);
    
    if (result.error) {
      setError(result.error);
      toast({ 
        title: "Error", 
        description: result.error || "Failed to load family members",
        variant: "destructive"
      });
    } else if (result.data) {
      setMembers(result.data);
      
      // Cache the results
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          members: result.data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error("Failed to cache family members:", e);
      }
    }
    
    setLoading(false);
  }, [targetFamilyId, cacheKey]);

  // Load data when target family changes
  useEffect(() => {
    if (targetFamilyId) {
      refetch();
    } else {
      setMembers([]);
    }
  }, [targetFamilyId, refetch]);

  return {
    members,
    loading,
    error,
    refetch
  };
};
