
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
  const { data: familyData, error: fetchError } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();
    
  if (fetchError) {
    console.error("Error fetching family by ID:", fetchError);
    return null;
  }
  
  return familyData as Family;
}

/**
 * Verifies if a family was created despite constraint violations
 * @param name Family name
 * @param userId User ID
 * @returns The family if found, or null
 */
export async function verifyFamilyCreatedDespiteError(name: string, userId: string): Promise<Family | null> {
  // Wait to ensure any async DB operations complete
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const { data: checkFamilies, error: checkFamiliesError } = await supabase
    .from('families')
    .select('*')
    .eq('name', name)
    .eq('created_by', userId)
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (!checkFamiliesError && checkFamilies && checkFamilies.length > 0) {
    console.log("Family was created successfully despite constraint violation:", checkFamilies[0]);
    return checkFamilies[0] as Family;
  }
  
  return null;
}
