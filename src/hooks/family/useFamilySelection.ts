
import { useState, useCallback, useEffect } from "react";
import { Family } from "@/types/familyTypes";

/**
 * Custom hook for managing family selection state
 */
export function useFamilySelection(families: Family[]) {
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(() =>
    localStorage.getItem("activeFamilyId")
  );

  // Handle initial family selection and updates when family list changes
  useEffect(() => {
    if (families.length > 0) {
      handleFamilySelection(families);
    }
  }, [families]);

  // Function to handle family selection logic
  const handleFamilySelection = useCallback((familiesData: Family[]) => {
    // Set first family as active if none selected
    if (!activeFamilyId && familiesData.length > 0) {
      console.log("No active family, setting first family as active");
      handleSelectFamily(familiesData[0].id);
    } else if (activeFamilyId && !familiesData.some(f => f.id === activeFamilyId)) {
      console.log("Active family not found in results, clearing selection");
      setActiveFamilyId(null);
      localStorage.removeItem("activeFamilyId");
    }
  }, [activeFamilyId]);

  // Function to select a family
  const handleSelectFamily = useCallback((familyId: string) => {
    console.log("FamilyContext: selecting family:", familyId);
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  }, []);

  return {
    activeFamilyId,
    handleSelectFamily
  };
}
