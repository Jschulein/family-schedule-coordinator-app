
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyServiceResponse } from "@/types/familyTypes";
import { handleError } from "@/utils/error";
import { toast } from "@/components/ui/use-toast";

/**
 * Creates a new family using the security definer function
 * Updated to use the improved safe_create_family function
 * @param name The name of the family
 * @param userId The ID of the user creating the family
 * @returns The created family or error
 */
export async function createFamilyCore(name: string, userId: string): Promise<FamilyServiceResponse<Family>> {
  if (!name.trim()) {
    return {
      data: null,
      error: "Family name cannot be empty",
      isError: true
    };
  }
  
  try {
    console.log("Creating new family using safe_create_family function");
    
    // Call the improved security definer function
    const { data: familyId, error } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: userId 
      });
      
    if (error) {
      console.error("Error creating family:", error);
      return {
        data: null,
        error: error.message,
        isError: true
      };
    }
    
    if (!familyId) {
      console.error("No family ID returned from safe_create_family");
      return {
        data: null,
        error: "Failed to create family",
        isError: true
      };
    }
    
    // Fetch the created family using the safe function
    const { data: families } = await fetchUserFamilies();
    
    // Find the newly created family
    const newFamily = families?.find(f => f.id === familyId);
    
    if (newFamily) {
      return {
        data: newFamily,
        error: null,
        isError: false
      };
    }
    
    // Fallback in case we can't find the new family
    return {
      data: { 
        id: familyId, 
        name, 
        color: '#8B5CF6',
        created_by: userId,
        created_at: new Date().toISOString()
      } as Family,
      error: null,
      isError: false
    };
  } catch (error: any) {
    console.error("Exception in createFamilyCore:", error);
    const errorMessage = handleError(error, {
      context: "Creating family",
      showToast: true
    });
    return {
      data: null,
      error: errorMessage,
      isError: true
    };
  }
}

/**
 * Fetches all families for the current user
 * Using the security definer function to avoid RLS recursion issues
 * @returns All user's families or error
 */
export async function fetchUserFamilies(): Promise<FamilyServiceResponse<Family[]>> {
  try {
    console.log("Fetching user families using security definer function");
    
    // Use the security definer function
    const { data, error } = await supabase.rpc('get_user_families_safe');
    
    if (error) {
      console.error("Error fetching user families:", error);
      
      // Fallback to direct query if RPC fails
      const { data: directData, error: directError } = await supabase
        .from('families')
        .select('*')
        .order('name');
        
      if (directError) {
        throw directError;
      }
      
      return {
        data: directData as Family[],
        error: null,
        isError: false
      };
    }
    
    return {
      data: data as Family[],
      error: null,
      isError: false
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching families",
      showToast: true
    });
    
    return {
      data: [],
      error: errorMessage,
      isError: true
    };
  }
}

/**
 * Runs a diagnostic check on the family system
 * Useful for debugging family creation issues
 * @param familyName Optional family name to check
 * @returns Diagnostic data
 */
export async function diagnoseFamilySystem(familyName?: string): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: "Not authenticated" };
    }
    
    const { data, error } = await supabase.rpc(
      'debug_family_creation',
      {
        p_name: familyName || "Test Family",
        p_user_id: user.id
      }
    );
    
    if (error) {
      console.error("Diagnostic error:", error);
      return { error: error.message };
    }
    
    return data;
  } catch (err: any) {
    console.error("Error running diagnostics:", err);
    return { error: err.message };
  }
}
