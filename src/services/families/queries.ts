
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
    // Use the security definer function to avoid infinite recursion
    const { data, error } = await supabase.rpc('get_family_members');
    
    if (error) {
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
