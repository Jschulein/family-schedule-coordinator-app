
import { ReactNode, useEffect } from "react";
import { FamilyContext } from "./FamilyContext";
import { useFamilyData } from "@/hooks/family/useFamilyData";
import { useFamilySelection } from "@/hooks/family/useFamilySelection";
import { useFamilyCreation } from "@/hooks/family/useFamilyCreation";
import { useFamilyRealtimeSubscription } from "@/hooks/family/useFamilyRealtimeSubscription";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface FamilyProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the Family context
 * Handles global family state management
 */
export const FamilyProvider = ({ children }: FamilyProviderProps) => {
  // Enable debug mode in development
  const [debugMode] = useLocalStorage('family-debug-mode', process.env.NODE_ENV === 'development');

  // Use our custom hooks for state management
  const { families, loading, error: familyError, fetchFamilies } = useFamilyData();
  const { activeFamilyId, handleSelectFamily } = useFamilySelection(families);
  
  const { 
    creating, 
    createFamily, 
    error: creationError, 
    retryCount,
    runDiagnostics
  } = useFamilyCreation({
    onSuccess: (newFamily) => {
      fetchFamilies().then(() => {
        if (newFamily) {
          handleSelectFamily(newFamily.id);
        }
      });
    },
    maxRetries: 3, // Allow up to 3 retries for transient issues
    debug: debugMode
  });

  // Set up realtime subscription for family changes
  useFamilyRealtimeSubscription(fetchFamilies);

  // Combine errors from both hooks
  const error = familyError || creationError;
  
  // Run diagnostics on mount in debug mode
  useEffect(() => {
    if (debugMode && runDiagnostics && error) {
      runDiagnostics();
    }
  }, [debugMode, error, runDiagnostics]);

  return (
    <FamilyContext.Provider
      value={{
        families,
        loading,
        error,
        creating,
        activeFamilyId,
        fetchFamilies,
        createFamily,
        handleSelectFamily,
        retryCount, // Expose retry count to the UI
        debugMode   // Expose debug mode to the UI
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
