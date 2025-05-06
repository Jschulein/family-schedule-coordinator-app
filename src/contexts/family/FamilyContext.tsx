
import { createContext } from "react";
import type { FamilyContextType } from "@/types/familyTypes";

// Create context with default values
export const FamilyContext = createContext<FamilyContextType>({
  families: [],
  activeFamilyId: null,
  loading: false,
  error: null,
  creating: false,
  fetchFamilies: async () => {},
  createFamily: async () => undefined,
  handleSelectFamily: () => {},
});
