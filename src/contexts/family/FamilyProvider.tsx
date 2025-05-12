
import { ReactNode } from "react";
import { FamilyContext } from "./FamilyContext";
import { useFamilyData } from "@/hooks/family/useFamilyData";
import { useFamilySelection } from "@/hooks/family/useFamilySelection";
import { useFamilyCreation } from "@/hooks/family/useFamilyCreation";
import { useFamilyRealtimeSubscription } from "@/hooks/family/useFamilyRealtimeSubscription";

interface FamilyProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the Family context
 * Handles global family state management
 */
export const FamilyProvider = ({ children }: FamilyProviderProps) => {
  // Use our custom hooks for state management
  const { families, loading, error, fetchFamilies } = useFamilyData();
  const { activeFamilyId, handleSelectFamily } = useFamilySelection(families);
  const { creating, createFamily, error: creationError } = useFamilyCreation((newFamily) => {
    fetchFamilies().then(() => {
      if (newFamily) {
        handleSelectFamily(newFamily.id);
      }
    });
  });

  // Set up realtime subscription for family changes
  useFamilyRealtimeSubscription(fetchFamilies);

  // Combine errors from both hooks
  const combinedError = error || creationError;

  return (
    <FamilyContext.Provider
      value={{
        families,
        loading,
        error: combinedError,
        creating,
        activeFamilyId,
        fetchFamilies,
        createFamily,
        handleSelectFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
