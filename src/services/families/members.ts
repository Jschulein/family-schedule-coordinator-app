
/**
 * Family Member Services
 * Provides operations for managing family members
 */
import { supabase } from "@/integrations/supabase/client";
import { FamilyMember } from "@/types/familyTypes";
import { handleError } from "@/utils/error";

/**
 * Fetches family members for all families the current user has access to
 * Uses a security definer function to prevent infinite recursion
 * @returns Result containing family members data or error
 */
export async function fetchFamilyMembers() {
  try {    
    console.log("Fetching all family members for the current user");
    
    // Use our security definer function to avoid RLS recursion
    const { data: membersData, error: membersError } = await supabase
      .rpc('get_all_family_members_for_user');
      
    if (membersError) {
      console.error("Error fetching family members:", membersError);
      throw membersError;
    }
    
    return {
      data: membersData as FamilyMember[],
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

/**
 * Checks if the current user is a member of a specific family
 * @param familyId The ID of the family to check
 * @returns Whether the user is a member of the family
 */
export async function isUserMemberOfFamily(familyId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('safe_is_family_member', { p_family_id: familyId });
      
    if (error) {
      console.error("Error checking family membership:", error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error("Exception in isUserMemberOfFamily:", error);
    return false;
  }
}

/**
 * Fetches family members for a specific family
 * @param familyId The ID of the family
 * @returns Result containing family members data or error
 */
export async function fetchFamilyMembersByFamilyId(familyId: string) {
  try {
    if (!familyId) {
      throw new Error("Family ID is required");
    }
    
    console.log(`Fetching members for family ${familyId}`);
    
    // Use a security definer function to avoid RLS recursion
    const { data, error } = await supabase
      .rpc('get_family_members_by_family_id', { p_family_id: familyId });
      
    if (error) {
      console.error("Error fetching family members:", error);
      throw error;
    }
    
    return {
      data: data as FamilyMember[],
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
