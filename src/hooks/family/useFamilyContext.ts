
/**
 * Hook for accessing the family context
 * Provides type safety and error handling
 */
import { useFamilyContext as useContext } from "@/contexts/FamilyContext";

export const useFamilyContext = () => {
  return useContext();
};

/**
 * Hook for accessing just the active family ID
 * Useful when you only need the ID without the other context values
 */
export const useActiveFamilyId = () => {
  const { activeFamilyId } = useContext();
  return activeFamilyId;
};

/**
 * Hook for accessing the list of families
 * Useful when you only need the family list
 */
export const useFamilies = () => {
  const { families, loading, error, fetchFamilies } = useContext();
  return { families, loading, error, fetchFamilies };
};
