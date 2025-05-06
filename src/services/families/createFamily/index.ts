
/**
 * Family creation service
 * Consolidates all family creation logic in one place
 */
import { supabase } from "@/integrations/supabase/client";
import { Family } from "@/types/familyTypes";
import { FamilyServiceResponse } from "../types";
import { formatDatabaseError } from "@/utils/error/databaseErrorHandler";
import { handleError } from "@/utils/error";

/**
 * Creates a new family with the current user as admin
 * @param name The name of the family to create
 * @returns The created family or error
 */
export async function createFamily(name: string): Promise<FamilyServiceResponse<Family>> {
  if (!name.trim()) {
    return {
      data: null,
      error: "Family name cannot be empty",
      isError: true
    };
  }

  try {
    console.log("Creating family using safe_create_family function");
    
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: "You must be logged in to create a family",
        isError: true
      };
    }
    
    // Call the security definer function to safely create the family
    const { data, error } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: user.id 
      });
      
    if (error) {
      // Check if it's a duplicate key constraint
      if (error.code === '23505') {
        // Try to get the existing family
        const { data: families } = await supabase
          .rpc('get_user_families');
          
        const existingFamily = families?.find(f => f.name === name);
        if (existingFamily) {
          return {
            data: existingFamily as Family,
            error: "A family with this name already exists",
            isError: false
          };
        }
      }
      
      return {
        data: null,
        error: formatDatabaseError(error),
        isError: true
      };
    }
    
    if (!data) {
      return {
        data: null,
        error: "Failed to create family",
        isError: true
      };
    }
    
    // Fetch the complete family data
    const familyId = data;
    const { data: families } = await supabase.rpc('get_user_families');
    const newFamily = families?.find(f => f.id === familyId);
    
    if (newFamily) {
      return {
        data: newFamily as Family,
        error: null,
        isError: false
      };
    }
    
    // Fallback in case we can't find the new family
    return {
      data: { id: familyId, name, created_by: user.id } as Family,
      error: null,
      isError: false
    };
  } catch (error) {
    handleError(error, { 
      context: "Creating family",
      title: "Error creating family"
    });
    
    return {
      data: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      isError: true
    };
  }
}

/**
 * Creates a family with members
 * @param name Family name
 * @param members Members to invite to the family
 * @returns The created family or error
 */
export async function createFamilyWithMembers(
  name: string,
  members: { name: string; email: string; role: string }[]
): Promise<FamilyServiceResponse<Family>> {
  // First create the family
  const familyResult = await createFamily(name);
  
  // If family creation failed, return the error
  if (familyResult.isError || !familyResult.data) {
    return familyResult;
  }
  
  const family = familyResult.data;
  
  // If no members to invite, return the family
  if (!members || members.length === 0) {
    return familyResult;
  }
  
  try {
    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: family,
        error: "Family created, but failed to invite members: You must be logged in",
        isError: false
      };
    }
    
    // Invite each member
    const invitePromises = members.map(member =>
      supabase.rpc('invite_family_member', {
        p_family_id: family.id,
        p_email: member.email,
        p_name: member.name,
        p_role: member.role,
        p_invited_by: user.id
      })
    );
    
    await Promise.all(invitePromises);
    
    return {
      data: family,
      error: null,
      isError: false
    };
  } catch (error) {
    handleError(error, {
      context: "Inviting family members", 
      title: "Error inviting family members"
    });
    
    return {
      data: family,
      error: "Family created, but failed to invite some members",
      isError: false
    };
  }
}

// Re-export for backward compatibility
export * from './createFamilyWithMembers';
export * from './validators';
