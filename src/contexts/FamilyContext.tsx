
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";
import { fetchUserFamilies, createFamily as createFamilyService } from "@/services/familyService";
import type { Family, FamilyContextType } from "@/types/familyTypes";
import { handleError } from "@/utils/errorHandler";

// Create context with default values
const FamilyContext = createContext<FamilyContextType>({
  families: [],
  activeFamilyId: null,
  loading: false,
  error: null,
  creating: false,
  fetchFamilies: async () => {},
  createFamily: async () => undefined,
  handleSelectFamily: () => {},
});

export const useFamilyContext = () => {
  const context = useContext(FamilyContext);
  
  if (!context) {
    throw new Error('useFamilyContext must be used within a FamilyProvider');
  }
  
  return context;
};

interface FamilyProviderProps {
  children: ReactNode;
}

export const FamilyProvider = ({ children }: FamilyProviderProps) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(() =>
    localStorage.getItem("activeFamilyId")
  );

  const fetchFamilies = useCallback(async () => {
    console.log("FamilyContext: fetchFamilies called");
    setLoading(true);
    setError(null);
    
    const result = await fetchUserFamilies();
    
    if (result.isError) {
      setError(result.error || "Failed to load families");
      toast({ title: "Error", description: "Failed to load families" });
    } else if (result.data) {
      setFamilies(result.data);
      console.log(`FamilyContext: fetched ${result.data.length} families`);
      
      // Set first family as active if none selected
      if (!activeFamilyId && result.data.length > 0) {
        console.log("No active family, setting first family as active");
        handleSelectFamily(result.data[0].id);
      } else if (activeFamilyId && !result.data.some(f => f.id === activeFamilyId)) {
        console.log("Active family not found in results, clearing selection");
        setActiveFamilyId(null);
        localStorage.removeItem("activeFamilyId");
      }
    }
    
    setLoading(false);
  }, [activeFamilyId]);

  const createFamilyHandler = async (name: string) => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a family name" });
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      console.log("FamilyContext: creating new family:", name);
      const result = await createFamilyService(name);
      
      if (result.isError) {
        setError(result.error || "Failed to create family");
        toast({ title: "Error", description: result.error || "Failed to create family" });
        throw new Error(result.error);
      }
      
      if (!result.data) {
        throw new Error("No data returned when creating family");
      }
      
      toast({ title: "Success", description: "Family created successfully!" });
      
      // Fetch all families again to make sure we have the latest data
      await fetchFamilies();
      
      handleSelectFamily(result.data.id);
      return result.data;
    } catch (error: any) {
      handleError(error, { 
        context: "Creating family",
        showToast: false // Already handled above
      });
      throw error; // Propagate the error so the form can handle it
    } finally {
      setCreating(false);
    }
  };

  const handleSelectFamily = (familyId: string) => {
    console.log("FamilyContext: selecting family:", familyId);
    setActiveFamilyId(familyId);
    localStorage.setItem("activeFamilyId", familyId);
  };

  return (
    <FamilyContext.Provider
      value={{
        families,
        loading,
        error,
        creating,
        activeFamilyId,
        fetchFamilies,
        createFamily: createFamilyHandler,
        handleSelectFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
