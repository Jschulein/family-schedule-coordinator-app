
import { supabase } from "@/integrations/supabase/client";
import { Family } from "@/types/familyTypes";

/**
 * Checks if a family with the given name already exists for the user
 * @param name The name of the family to check
 * @param userId The ID of the user
 * @returns The existing family if found, null otherwise
 */
export async function checkFamilyExists(name: string, userId: string): Promise<Family | null> {
  try {
    // First get all families for the current user
    const { data: families, error } = await supabase.rpc('get_user_families');
    
    if (error || !families) {
      console.error("Error checking for existing family:", error);
      return null;
    }
    
    // Check if there's a family with the given name
    const existingFamily = families.find(f => 
      f.name.toLowerCase() === name.toLowerCase() && 
      f.created_by === userId
    );
    
    return existingFamily || null;
  } catch (error) {
    console.error("Exception checking for existing family:", error);
    return null;
  }
}
