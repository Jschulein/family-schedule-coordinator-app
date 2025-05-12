
/**
 * Hook for accessing the family context
 * Provides type safety and error handling
 */
import { useFamilyContext as useContext } from "@/contexts/family";
import { Family } from "@/types/familyTypes";

/**
 * Main hook for accessing the family context
 * @returns The full family context
 */
export const useFamilyContext = () => {
  return useContext();
};

/**
 * Hook for accessing just the active family ID
 * Useful when you only need the ID without the other context values
 * @returns The active family ID or null
 */
export const useActiveFamilyId = () => {
  const { activeFamilyId } = useContext();
  return activeFamilyId;
};

/**
 * Hook for accessing the list of families
 * Useful when you only need the family list without other context values
 * @returns Object containing families array, loading state, error state, and refresh function
 */
export const useFamilies = (): {
  families: Family[];
  loading: boolean;
  error: string | null;
  fetchFamilies: () => Promise<void>;
} => {
  const { families, loading, error, fetchFamilies } = useContext();
  return { families, loading, error, fetchFamilies };
};
