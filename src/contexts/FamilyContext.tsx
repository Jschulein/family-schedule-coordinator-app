
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";
import { fetchUserFamilies, createFamily } from "@/services/families";
import type { Family, FamilyContextType } from "@/types/familyTypes";
import { handleError } from "@/utils/error";
import { supabase } from "@/integrations/supabase/client";
import { callWithFallback, directTableQuery } from "@/services/events/helpers/databaseUtils";

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
      // Try using our secured function first
      const { data: familiesData, error: functionError } = await callWithFallback<Family[]>(
        'get_user_families_safe', 
        'get_user_families'
      );
      
      if (functionError || !familiesData) {
        console.log("Both RPC functions failed, attempting direct query as last resort");
        
        // Last resort: try direct database query
        const { data: directData, error: directError } = await directTableQuery<Family[]>('families', {
          select: '*',
          order: { name: 'asc' }
        });
        
        if (directError || !directData) {
          setError("Failed to load families. Please try again later.");
          toast({ 
            title: "Error", 
            description: "Failed to load families", 
            variant: "destructive"
          });
          return;
        }
        
        console.log(`FamilyContext: fetched ${directData.length} families via direct query`);
        setFamilies(directData as Family[]);
        handleFamilySelection(directData as Family[]);
        return;
      }
      
      console.log(`FamilyContext: fetched ${familiesData.length} families via RPC function`);
      setFamilies(familiesData as Family[]);
      handleFamilySelection(familiesData as Family[]);
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

  const handleFamilySelection = (familiesData: Family[]) => {
    // Set first family as active if none selected
    if (!activeFamilyId && familiesData.length > 0) {
      console.log("No active family, setting first family as active");
      handleSelectFamily(familiesData[0].id);
    } else if (activeFamilyId && !familiesData.some(f => f.id === activeFamilyId)) {
      console.log("Active family not found in results, clearing selection");
      setActiveFamilyId(null);
      localStorage.removeItem("activeFamilyId");
    }
  };

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
      
      // Try to create family with multiple methods
      let result;
      try {
        console.log("Trying to create family with safe_create_family");
        result = await createFamily(name, user.id);
      } catch (createError) {
        console.error("Error with primary family creation method:", createError);
        
        // Fallback to direct insert if RPC failed
        try {
          console.log("Falling back to direct insert for family creation");
          const { data: insertData, error: insertError } = await supabase
            .from('families')
            .insert({
              name,
              created_by: user.id
            })
            .select()
            .single();
            
          if (insertError) {
            throw insertError;
          }
          
          result = {
            data: insertData,
            isError: false,
            error: null
          };
        } catch (fallbackError) {
          console.error("Fallback family creation also failed:", fallbackError);
          throw fallbackError;
        }
      }
      
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
