
/**
 * Simplified family service with cleaner data access patterns
 */
import { Family, FamilyMember, FamilyServiceResponse } from "@/types/familyTypes";
import { fetchData, callFunction, insertRecord, fetchById } from "@/services/database";

/**
 * Fetches all families for the current user
 */
export async function getUserFamilies(): Promise<FamilyServiceResponse<Family[]>> {
  // Try to fetch families using a database function first
  const { data, error } = await callFunction<Family[]>("get_user_families");
  
  if (error) {
    console.warn("Failed to fetch families using RPC function, falling back to direct query");
    
    // Fallback to direct query if RPC fails
    const directResult = await fetchData<Family>("families");
    
    if (directResult.error) {
      return {
        data: null,
        error: `Failed to load families: ${directResult.error}`,
        isError: true
      };
    }
    
    return {
      data: directResult.data || [],
      error: null,
      isError: false
    };
  }
  
  return {
    data: data || [],
    error: null,
    isError: false
  };
}

/**
 * Fetches members of a specific family
 * @param familyId The ID of the family to get members for
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyServiceResponse<FamilyMember[]>> {
  if (!familyId) {
    return {
      data: [],
      error: "Family ID is required",
      isError: true
    };
  }
  
  // Try RPC function first
  const { data, error } = await callFunction<FamilyMember[]>(
    "get_family_members_by_family_id", 
    { p_family_id: familyId }
  );
  
  if (error) {
    console.warn("Failed to fetch family members using RPC, falling back to direct query");
    
    // Fall back to direct query
    const directResult = await fetchData<FamilyMember>("family_members", {
      filters: { family_id: familyId }
    });
    
    if (directResult.error) {
      return {
        data: null,
        error: `Failed to load family members: ${directResult.error}`,
        isError: true
      };
    }
    
    return {
      data: directResult.data || [],
      error: null,
      isError: false
    };
  }
  
  return {
    data: data || [],
    error: null,
    isError: false
  };
}

/**
 * Creates a new family
 * @param name The family name
 */
export async function createFamily(name: string): Promise<FamilyServiceResponse<Family>> {
  if (!name.trim()) {
    return {
      data: null,
      error: "Family name is required",
      isError: true
    };
  }
  
  // Try to use the safe create function first
  const { data: familyId, error: funcError } = await callFunction<string>(
    "safe_create_family",
    { p_name: name, p_user_id: null } // User ID is populated by the function from auth.uid()
  );
  
  if (funcError) {
    console.warn("Failed to create family using RPC, falling back to direct insert");
    
    // Fall back to direct insert
    const { data, error } = await insertRecord<Family>("families", { name });
    
    if (error) {
      return {
        data: null,
        error: `Failed to create family: ${error}`,
        isError: true
      };
    }
    
    return {
      data,
      error: null,
      isError: false
    };
  }
  
  // If RPC succeeded, fetch the newly created family
  const { data: family, error: fetchError } = await fetchById<Family>("families", familyId);
  
  if (fetchError) {
    return {
      data: null, 
      error: `Family created but failed to retrieve details: ${fetchError}`,
      isError: true
    };
  }
  
  return {
    data: family,
    error: null,
    isError: false
  };
}
