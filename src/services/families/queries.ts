
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyMember } from "./types";
import { handleError } from "@/utils/errorHandler";

/**
 * Fetches all families that the current user is a member of
 * @returns Result containing families data or error
 */
export async function fetchUserFamilies() {
  try {
    console.log("Fetching user families using security definer function");
    
    // Use the security definer function to avoid infinite recursion
    const { data, error } = await supabase.rpc('get_user_families');
    
    if (error) {
      throw error;
    }
    
    // The get_user_families function now returns the complete family data
    // so we can directly use the results
    return {
      data: data as Family[],
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching families",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}

/**
 * Fetches family members for all families the current user has access to
 * @returns Result containing family members data or error
 */
export async function fetchFamilyMembers() {
  try {    
    // First get the families the user belongs to
    const { data: userFamilies, error: userFamiliesError } = await supabase.rpc('get_user_families');
    
    if (userFamiliesError) {
      throw userFamiliesError;
    }
    
    if (!userFamilies || userFamilies.length === 0) {
      return {
        data: [],
        isError: false,
        error: null
      };
    }
    
    // Extract family IDs from the response
    const familyIds = userFamilies.map(family => family.id);
    
    // Use the security definer function instead of directly querying the family_members table
    // This will prevent the infinite recursion in the RLS policy
    const { data: membersData, error: membersError } = await supabase
      .rpc('get_family_members');
      
    if (membersError) {
      throw membersError;
    }
    
    // Filter the results to only include members from the user's families
    const filteredMembers = membersData.filter(member => 
      familyIds.includes(member.family_id)
    );
    
    return {
      data: filteredMembers as FamilyMember[],
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching family members",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}
