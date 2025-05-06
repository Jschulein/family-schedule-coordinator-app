import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";
import { fetchUserFamilies, createFamily } from "@/services/families";
import type { Family, FamilyContextType } from "@/types/familyTypes";
import { handleError } from "@/utils/error";
import { supabase } from "@/integrations/supabase/client";

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
    
    try {
      // Try direct database query as a fallback for RPC error
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*')
        .order('name');
      
      if (familiesError) {
        console.error("Error fetching families directly:", familiesError);
        setError("Failed to load families. Please try again later.");
        toast({ 
          title: "Error", 
          description: "Failed to load families", 
          variant: "destructive"
        });
      } else if (familiesData) {
        console.log(`FamilyContext: fetched ${familiesData.length} families directly`);
        setFamilies(familiesData as Family[]);
        
        // Set first family as active if none selected
        if (!activeFamilyId && familiesData.length > 0) {
          console.log("No active family, setting first family as active");
          handleSelectFamily(familiesData[0].id);
        } else if (activeFamilyId && !familiesData.some(f => f.id === activeFamilyId)) {
          console.log("Active family not found in results, clearing selection");
          setActiveFamilyId(null);
          localStorage.removeItem("activeFamilyId");
        }
      }
    } catch (error: any) {
      console.error("Error in fetchFamilies:", error);
      setError(error.message || "An unexpected error occurred");
      toast({ 
        title: "Error", 
        description: "Failed to load families", 
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
      // Get the current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Pass both required arguments: name and userId
      const result = await createFamily(name, user.id);
      
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
