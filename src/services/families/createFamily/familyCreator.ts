
import { supabase } from "@/integrations/supabase/client";
import { Family } from "@/types/familyTypes";
import { verifyFamilyCreatedDespiteError, getFamilyById } from "./familyExistenceChecker";
import { createSuccessResponse, createErrorResponse } from "./errorHandlers";
import { FamilyServiceResponse } from "../types";

/**
 * Creates a new family using the security definer function
 * @param name Family name
 * @param userId User ID
 * @returns Result of the family creation
 */
export async function createNewFamily(
  name: string,
  userId: string
): Promise<FamilyServiceResponse<Family>> {
  console.log("Creating new family with safe_create_family function. User ID:", userId);
  
  const { data, error: functionError } = await supabase
    .rpc('safe_create_family', { 
      p_name: name, 
      p_user_id: userId 
    });

  if (functionError) {
    console.error("Error creating family with RPC function:", functionError);
    
    // Enhanced error handling for duplicate key constraint violations
    if (functionError.code === '23505' && 
        functionError.message.includes("family_members_family_id_user_id_key")) {
      console.warn("Duplicate family member constraint detected - checking if family was created");
      
      // Check if the family was created despite the error
      const family = await verifyFamilyCreatedDespiteError(name, userId);
      if (family) {
        return createSuccessResponse(family);
      }
    }
    
    // For any other error type
    return createErrorResponse(`Error creating family: ${functionError.message}`);
  }
  
  if (!data) {
    console.error("No data returned when creating family");
    return createErrorResponse("No data returned when creating family");
  }
  
  const familyId = data;
  console.log(`Family created with ID: ${familyId}`);
  
  // Fetch the complete family data to return
  const family = await getFamilyById(familyId);
  
  if (family) {
    return createSuccessResponse(family);
  } else {
    // We still return the family ID as it was created successfully
    return createSuccessResponse({ 
      id: familyId, 
      name, 
      created_by: userId 
    } as Family);
  }
}
