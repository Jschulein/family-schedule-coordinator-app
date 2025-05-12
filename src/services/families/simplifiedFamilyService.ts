
/**
 * Simplified Family Service
 * Provides a clean, consistent API for all family-related operations
 */
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyMember, FamilyServiceResponse, FamilyRole } from "@/types/familyTypes";
import { handleError } from "@/utils/error";
import { callFunction } from "../database/functions";

/**
 * Gets all families for the current user
 * @returns All families the user is a member of
 */
export async function getUserFamilies(): Promise<FamilyServiceResponse<Family[]>> {
  try {
    console.log("Fetching user families using security definer function");
    
    // Use the security definer function to avoid infinite recursion
    const { data, error } = await supabase.rpc('get_user_families');
    
    if (error) {
      console.error("Error fetching user families:", error);
      throw error;
    }
    
    return {
      data: data as Family[],
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching families",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}

/**
 * Gets all members for a specific family
 * @param familyId The ID of the family
 * @returns All members of the family
 */
export async function getFamilyMembers(familyId: string): Promise<FamilyServiceResponse<FamilyMember[]>> {
  try {
    console.log(`Fetching members for family ${familyId}`);
    
    // Use security definer function to avoid recursion
    const { data, error } = await supabase.rpc('get_family_members_by_family_id', {
      p_family_id: familyId
    });
    
    if (error) {
      console.error("Error fetching family members:", error);
      throw error;
    }
    
    return {
      data: data as FamilyMember[],
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching family members",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}

/**
 * Creates a new family
 * @param name The name of the family
 * @returns The newly created family
 */
export async function createFamily(name: string): Promise<FamilyServiceResponse<Family>> {
  try {
    if (!name.trim()) {
      return {
        data: null,
        isError: true,
        error: "Family name cannot be empty"
      };
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        isError: true,
        error: "User not authenticated"
      };
    }
    
    console.log("Creating new family using safe_create_family function");
    
    // Call the security definer function to safely create the family
    const { data: familyId, error } = await supabase.rpc('safe_create_family', { 
      p_name: name, 
      p_user_id: user.id 
    });
    
    if (error) {
      console.error("Error creating family:", error);
      return {
        data: null,
        isError: true,
        error: error.message
      };
    }
    
    if (!familyId) {
      return {
        data: null,
        isError: true,
        error: "Failed to create family"
      };
    }
    
    // Fetch the complete family data
    const { data: families } = await getUserFamilies();
    const newFamily = families?.find(f => f.id === familyId);
    
    if (newFamily) {
      return {
        data: newFamily,
        isError: false,
        error: null
      };
    }
    
    // Fallback in case we can't find the new family
    return {
      data: { 
        id: familyId, 
        name,
        created_by: user.id 
      } as Family,
      isError: false,
      error: null
    };
  } catch (error: any) {
    console.error("Exception in createFamily:", error);
    return {
      data: null,
      isError: true,
      error: "An unexpected error occurred creating the family"
    };
  }
}

/**
 * Fetches all invitations for a family
 * @param familyId The ID of the family
 * @returns All invitations for the family
 */
export async function getFamilyInvitations(familyId: string) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('family_id', familyId);
      
    if (error) {
      console.error("Error fetching invitations:", error);
      throw error;
    }
    
    return {
      data,
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching invitations",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}

/**
 * Resends an invitation
 * @param invitationId The ID of the invitation
 * @returns Success or error
 */
export async function resendInvitation(invitationId: string) {
  try {
    const { data, error } = await supabase
      .from('invitations')
      .update({
        last_invited: new Date().toISOString()
      })
      .eq('id', invitationId)
      .select();
    
    if (error) {
      console.error("Error resending invitation:", error);
      throw error;
    }
    
    return {
      data,
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Resending invitation",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}

/**
 * Invites a member to a family
 * @param familyId The ID of the family
 * @param email The email of the person to invite
 * @param role The role to assign to the person
 * @param name The name to display for the person
 * @returns Success or error
 */
export async function inviteFamilyMember(
  familyId: string,
  email: string,
  role: FamilyRole,
  name?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        isError: true,
        error: "User not authenticated"
      };
    }
    
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        family_id: familyId,
        email,
        role,
        name: name || email,
        invited_by: user.id
      })
      .select();
    
    if (error) {
      console.error("Error inviting family member:", error);
      throw error;
    }
    
    return {
      data,
      isError: false,
      error: null
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Inviting family member",
      showToast: true
    });
    
    return {
      data: null,
      isError: true,
      error: errorMessage
    };
  }
}
