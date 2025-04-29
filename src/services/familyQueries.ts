
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

    // Use the security definer function to prevent infinite recursion
    const { data, error } = await supabase
      .rpc('get_user_families');
    
    if (error) {
      console.error("Error fetching user families:", error);
      return { 
        data: null, 
        error: error.message, 
        isError: true 
      };
    }
    
    // The data is now correctly typed as Family[] from our updated function
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
    // Use a security definer function to prevent infinite recursion
    const { data, error } = await supabase
      .rpc('get_family_members');

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
