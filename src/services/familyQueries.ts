
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/errorHandler";
import { Family, FamilyMember } from "@/types/familyTypes";

/**
 * Fetches all families that the current user belongs to
 * @returns An object containing families data and loading/error states
 */
export async function fetchUserFamilies() {
  console.log("Fetching families...");
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        data: null, 
        error: "Authentication required", 
        isError: true 
      };
    }

    // Use direct table query instead of RPC to avoid recursion issues
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .order('name');
    
    if (error) {
      console.error("Error fetching user families:", error);
      return { 
        data: null, 
        error: error.message, 
        isError: true 
      };
    }
    
    console.log(`Successfully fetched ${data?.length || 0} families`);
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
      data: null, 
      error: errorMessage, 
      isError: true 
    };
  }
}

/**
 * Fetches all family members for the families that the current user belongs to
 * @returns An object containing family members data and loading/error states
 */
export async function fetchFamilyMembers() {
  try {
    // Use direct table query with a join to avoid recursion
    const { data: userFamilies } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '');

    if (!userFamilies || userFamilies.length === 0) {
      return { 
        data: [], 
        error: null, 
        isError: false 
      };
    }

    const familyIds = userFamilies.map(f => f.family_id);
    
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .in('family_id', familyIds);

    if (error) {
      console.error("Error fetching family members:", error);
      return { 
        data: null, 
        error: "Failed to load family members", 
        isError: true 
      };
    }

    console.log(`Successfully loaded ${data?.length || 0} family members`);
    return { 
      data: data as FamilyMember[], 
      error: null, 
      isError: false 
    };
  } catch (err: any) {
    const errorMessage = handleError(err, {
      context: "Fetching family members",
      showToast: true
    });
    return { 
      data: null, 
      error: errorMessage, 
      isError: true 
    };
  }
}
