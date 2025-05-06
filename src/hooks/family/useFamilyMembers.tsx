
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { FamilyMember } from "@/types/familyTypes";
import { useFamilyContext } from "./useFamilyContext";
import { getFamilyMembers } from "@/services/families/simplifiedFamilyService";

/**
 * Simplified hook for fetching and managing family members
 */
export const useFamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { activeFamilyId } = useFamilyContext();

  // Cache key based on active family
  const cacheKey = `familyMembers_${activeFamilyId || 'none'}`;

  // Load cached data on mount
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

  // Memoized loading function
  const loadFamilyMembers = useCallback(async () => {
    // Don't fetch if no active family
    if (!activeFamilyId) {
      setFamilyMembers([]);
      setError(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const result = await getFamilyMembers(activeFamilyId);
    
    if (result.error) {
      setError(result.error);
      toast({ 
        title: "Error", 
        description: result.error || "Failed to load family members" 
      });
    } else if (result.data) {
      setFamilyMembers(result.data);
      
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
  }, [activeFamilyId, cacheKey]);

  // Load data when active family changes
  useEffect(() => {
    if (activeFamilyId) {
      loadFamilyMembers();
    } else {
      setFamilyMembers([]);
    }
  }, [activeFamilyId, loadFamilyMembers]);

  return {
    familyMembers,
    loading,
    error,
    refreshFamilyMembers: loadFamilyMembers
  };
};
