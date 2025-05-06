
/**
 * Simplified family service with cleaner data access patterns
 */
import { Family, FamilyMember } from "@/types/familyTypes";
import { getData, getById, insert, callFunction, DbResponse } from "../database/simpleSupabase";

/**
 * Standard response format with isError flag for backward compatibility
 */
interface FamilyServiceResponse<T> {
  data: T | null;
  error: string | null;
  isError: boolean;
}

/**
 * Convert our simplified DbResponse to the legacy format
 */
function toServiceResponse<T>(response: DbResponse<T>): FamilyServiceResponse<T> {
  return {
    data: response.data,
    error: response.error,
    isError: !!response.error
  };
}

/**
 * Fetches all families for the current user
 */
export async function getUserFamilies(): Promise<FamilyServiceResponse<Family[]>> {
  const result = await callFunction<Family[]>("get_user_families");
  
  if (result.error) {
    console.warn("Failed to fetch families using RPC function, falling back to direct query");
    const directResult = await getData<Family>("families");
    return toServiceResponse(directResult);
  }
  
  return toServiceResponse(result);
}

/**
 * Fetches members of a specific family
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyServiceResponse<FamilyMember[]>> {
  if (!familyId) {
    return {
      data: [],
      error: "Family ID is required",
      isError: true
    };
  }
  
  const result = await getData<FamilyMember>("family_members", {
    filters: { family_id: familyId }
  });
  
  return toServiceResponse(result);
}

/**
 * Creates a new family
 */
export async function createFamily(name: string): Promise<FamilyServiceResponse<Family>> {
  if (!name.trim()) {
    return {
      data: null,
      error: "Family name is required",
      isError: true
    };
  }
  
  // Using Partial<Family> for insert operation
  const result = await insert<Family>("families", { name } as Partial<Family>);
  return toServiceResponse(result);
}
