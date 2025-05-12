
/**
 * Family members service
 * Handles operations for family members with optimized database calls to avoid recursion
 */
import { supabase } from "@/integrations/supabase/client";
import { FamilyMember } from "@/types/familyTypes";
import { handleError } from "@/utils/error";
import { callFunction } from "../database/functions";

/**
 * Fetches family members using RPC to prevent recursion
 * @returns Result containing family members data or error
 */
export async function fetchFamilyMembers() {
  try {
    console.log("Fetching family members using security definer function");
    
    // Use the security definer function to avoid infinite recursion
    const { data, error } = await callFunction<FamilyMember[]>('get_family_members');
    
    if (error) {
      console.error("Error fetching family members:", error);
      throw new Error(error);
    }
    
    return {
      data: data as FamilyMember[],
      isError: false,
      error: null
    };
  } catch (error) {
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
 * Fetches members for a specific family
 * @param familyId The ID of the family
 * @returns Result containing family members data or error
 */
export async function fetchMembersByFamilyId(familyId: string) {
  try {
    console.log(`Fetching members for family ${familyId}`);
    
    // Use direct query with RLS policy that now uses the security definer function
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId);
      
    if (error) {
      console.error("Error fetching family members by ID:", error);
      throw new Error(error.message);
    }
    
    return {
      data: data as FamilyMember[],
      isError: false,
      error: null
    };
  } catch (error) {
    const errorMessage = handleError(error, {
      context: "Fetching family members by ID",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}
