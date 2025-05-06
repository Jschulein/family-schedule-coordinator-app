
import { supabase } from "@/integrations/supabase/client";
import { Family } from "@/types/familyTypes";

/**
 * Checks if a family with the given name already exists for the user
 * @param name Family name to check
 * @param userId User ID to check against
 * @returns The existing family or null if not found
 */
export async function checkFamilyExists(name: string, userId: string): Promise<Family | null> {
  const { data: existingFamily, error: checkError } = await supabase
    .from('families')
    .select('*')
    .eq('name', name)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (!checkError && existingFamily && existingFamily.length > 0) {
    console.log("Family with this name already exists:", existingFamily[0]);
    return existingFamily[0] as Family;
  }

  return null;
}

/**
 * Looks up a family by ID after creation
 * @param familyId The ID of the family to retrieve
 * @returns The family or null if not found
 */
export async function getFamilyById(familyId: string): Promise<Family | null> {
  try {
    // Try to get the family directly first (faster)
    const { data: family, error: directError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
      
    if (!directError && family) {
      return family as Family;
    }
    
    // Fallback to using get_user_families function to bypass RLS
    const { data: allFamilies, error: fetchError } = await supabase
      .rpc('get_user_families');
      
    if (fetchError) {
      console.error("Error fetching families to get by ID:", fetchError);
      return null;
    }
    
    const matchingFamily = allFamilies?.find(f => f.id === familyId);
    return matchingFamily || null;
  } catch (error) {
    console.error("Error in getFamilyById:", error);
    return null;
  }
}

/**
 * Verifies if a family was created despite constraint violations
 * @param name Family name
 * @param userId User ID
 * @returns The family if found, or null
 */
export async function verifyFamilyCreatedDespiteError(name: string, userId: string): Promise<Family | null> {
  // Wait to ensure any async DB operations complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Query directly against the families table first
    const { data: familyCheck, error: checkError } = await supabase
      .from('families')
      .select('*')
      .eq('name', name)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (!checkError && familyCheck && familyCheck.length > 0) {
      console.log("Family was created successfully despite constraint violation:", familyCheck[0]);
      return familyCheck[0] as Family;
    }

    // As a fallback, try using the RPC function
    const { data: allFamilies, error: fetchError } = await supabase
      .rpc('get_user_families');
    
    if (!fetchError && allFamilies) {
      const family = allFamilies.find(f => f.name === name && f.created_by === userId);
      if (family) {
        console.log("Found family with RPC function despite constraint violation:", family);
        return family as Family;
      }
    }
  } catch (error) {
    console.error("Error in verifyFamilyCreatedDespiteError:", error);
  }
  
  return null;
}
