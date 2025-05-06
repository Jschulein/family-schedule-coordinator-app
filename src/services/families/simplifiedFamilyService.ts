
/**
 * Simplified family service with cleaner data access patterns
 */
import { Family, FamilyMember } from "@/types/familyTypes";
import { getData, getById, insert, callFunction, DbResponse } from "../database/simpleSupabase";

/**
 * Get all families for the current user
 */
export async function getUserFamilies(): Promise<DbResponse<Family[]>> {
  // Try to use the database function first
  const funcResult = await callFunction<Family[]>("get_user_families");
  
  if (!funcResult.error) {
    return funcResult;
  }
  
  // Fall back to direct query if function fails
  console.warn("RPC function failed, falling back to direct query");
  return getData<Family>("families");
}

/**
 * Get family members for a specific family
 */
export async function getFamilyMembers(familyId: string): Promise<DbResponse<FamilyMember[]>> {
  if (!familyId) {
    return { data: [], error: "Family ID is required" };
  }
  
  return getData<FamilyMember>("family_members", {
    filters: { family_id: familyId }
  });
}

/**
 * Create a new family
 */
export async function createFamily(name: string): Promise<DbResponse<Family>> {
  if (!name.trim()) {
    return { data: null, error: "Family name is required" };
  }

  // Passing a Partial<Family> for insert operation
  return insert<Family>("families", { name } as Partial<Family>);
}
