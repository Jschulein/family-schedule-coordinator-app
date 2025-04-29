
// This hook is maintained for backwards compatibility
// New components should use the FamilyContext directly via useFamilyContext
import { useFamilyContext } from "@/contexts/FamilyContext";

export { type Family } from "@/types/familyTypes";

/**
 * @deprecated Use useFamilyContext() from FamilyContext instead
 * Hook for managing family-related state and operations
 */
export const useFamilies = () => {
  console.warn(
    "Warning: useFamilies() is deprecated and will be removed in a future version. " +
    "Use useFamilyContext() from '@/contexts/FamilyContext' instead."
  );
  return useFamilyContext();
};
