
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyServiceResponse } from "@/types/familyTypes";
import { formatDatabaseError } from "@/utils/error/databaseErrorHandler";
import { createErrorResponse, createSuccessResponse } from "./errorHandlers";

/**
 * Creates a new family using the safe_create_family RPC function
 * @param name The name of the family to create
 * @param userId The ID of the user creating the family
 * @returns The created family or error information
 */
export async function createNewFamily(name: string, userId: string): Promise<FamilyServiceResponse<Family>> {
  try {
    console.log("Creating new family using safe_create_family function");
    
    // Call the security definer function to safely create the family
    const { data, error } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: userId 
      });
      
    if (error) {
      return createErrorResponse(formatDatabaseError(error));
    }
    
    if (!data) {
      return createErrorResponse("Failed to create family");
    }
    
    // Fetch the complete family data
    const familyId = data;
    const { data: families } = await supabase.rpc('get_user_families');
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
    
  } catch (error) {
    console.error("Exception in createNewFamily:", error);
    return createErrorResponse("An unexpected error occurred creating the family");
  }
}
