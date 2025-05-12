
/**
 * Core Family Services
 * Provides fundamental family operations like fetching and creation
 */
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyServiceResponse } from "@/types/familyTypes";
import { handleDatabaseError, isRecoverableError } from "@/utils/error/databaseErrorMapper";
import { createErrorResponse, createSuccessResponse } from "./createFamily/errorHandlers";
import { performanceTracker } from "@/utils/testing";

/**
 * Maximum retries for recoverable database errors
 */
const MAX_RETRIES = 3;

/**
 * Fetches all families that the current user is a member of
 * @returns Result containing families data or error
 */
export async function fetchUserFamilies(): Promise<FamilyServiceResponse<Family[]>> {
  const trackingId = performanceTracker.startMeasure('fetchUserFamilies');
  
  try {
    console.log("Fetching user families using get_user_families function");
    
    // Use the security definer function to avoid infinite recursion
    const { data, error } = await supabase.rpc('get_user_families');
    
    if (error) {
      console.error("Error fetching user families:", error);
      const errorMessage = handleDatabaseError(error, "Fetching families", true);
      return createErrorResponse(errorMessage);
    }
    
    return createSuccessResponse(data as Family[]);
  } catch (error: any) {
    const errorMessage = handleDatabaseError(error, "Fetching families", true);
    return createErrorResponse(errorMessage);
  } finally {
    performanceTracker.endMeasure(trackingId);
  }
}

/**
 * Creates a new family using safe_create_family function with retry capability
 * @param name The name of the family
 * @param userId The ID of the user creating the family
 * @returns The newly created family or an error
 */
export async function createFamily(
  name: string, 
  userId: string, 
  retryCount = 0
): Promise<FamilyServiceResponse<Family>> {
  const trackingId = performanceTracker.startMeasure('createFamily');
  
  try {
    if (!name.trim()) {
      return createErrorResponse("Family name cannot be empty");
    }
    
    console.log(`Creating new family (attempt ${retryCount + 1}): ${name}`);
    
    // Call the security definer function to safely create the family
    const { data: familyId, error: insertError } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: userId 
      });
      
    if (insertError) {
      // If the error is recoverable and we haven't exceeded retry attempts, retry
      if (isRecoverableError(insertError) && retryCount < MAX_RETRIES) {
        console.log(`Recoverable error detected, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        return createFamily(name, userId, retryCount + 1);
      }
      
      return createErrorResponse(handleDatabaseError(insertError, "Creating family"));
    }
    
    if (!familyId) {
      return createErrorResponse("Failed to create family");
    }
    
    // Fetch the complete family data
    const { data: families, error: fetchError } = await supabase.rpc('get_user_families');
    
    if (fetchError) {
      console.warn("Family was created but error fetching details:", fetchError);
      // Return success with minimal family object if we can't fetch details
      return createSuccessResponse({ 
        id: familyId, 
        name, 
        created_by: userId,
        color: '#8B5CF6'
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
      created_by: userId,
      color: '#8B5CF6'
    } as Family);
    
  } catch (error: any) {
    console.error("Exception in createFamily:", error);
    return createErrorResponse(handleDatabaseError(error, "An unexpected error occurred creating the family"));
  } finally {
    performanceTracker.endMeasure(trackingId);
  }
}
