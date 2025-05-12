
/**
 * Core Family Services
 * Provides fundamental family operations like fetching and creation
 */
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyServiceResponse } from "@/types/familyTypes";
import { handleError } from "@/utils/error";
import { createErrorResponse, createSuccessResponse } from "./createFamily/errorHandlers";

/**
 * Fetches all families that the current user is a member of
 * @returns Result containing families data or error
 */
export async function fetchUserFamilies() {
  try {
    console.log("Fetching user families using get_user_families function");
    
    // Use the improved get_user_families function
    const { data, error } = await supabase.rpc('get_user_families');
    
    if (error) {
      console.error("Error fetching user families:", error);
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
 * Creates a new family using safe_create_family function
 * @param name The name of the family
 * @param userId The ID of the user creating the family
 * @returns The newly created family or an error
 */
export async function createFamily(name: string, userId: string): Promise<FamilyServiceResponse<Family>> {
  try {
    console.log("Creating new family using safe_create_family function");
    
    // Call the security definer function to safely create the family
    const { data: familyId, error: insertError } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: userId 
      });
      
    if (insertError) {
      return createErrorResponse(insertError.message);
    }
    
    if (!familyId) {
      return createErrorResponse("Failed to create family");
    }
    
    // Fetch the complete family data
    const { data: families, error: fetchError } = await supabase.rpc('get_user_families');
    
    if (fetchError) {
      console.error("Error fetching created family:", fetchError);
      // Return success with minimal family object if we can't fetch details
      return createSuccessResponse({ 
        id: familyId, 
        name, 
        created_by: userId 
      } as Family);
    }
    
    // Find the newly created family in the returned families
    const newFamily = families?.find(f => f.id === familyId);
    
    if (newFamily) {
      return createSuccessResponse(newFamily as Family);
    }
    
    // Fallback in case we can't find the new family
    return createSuccessResponse({ 
      id: familyId, 
      name, 
      created_by: userId 
    } as Family);
    
  } catch (error: any) {
    console.error("Exception in createFamily:", error);
    return createErrorResponse("An unexpected error occurred creating the family");
  }
}
