
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/errorHandler";
import { Family, FamilyRole } from "@/types/familyTypes";

/**
 * Creates a new family in the database
 * @param name The name of the family to create
 * @returns The created family or an error
 */
export async function createFamily(name: string) {
  if (!name.trim()) {
    return {
      data: null,
      error: "Please enter a family name",
      isError: true
    };
  }
  
  try {
    console.log("Creating new family:", name);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return {
        data: null,
        error: "You must be logged in to create a family",
        isError: true
      };
    }

    console.log("User authenticated, creating family with user ID:", user.id);
    
    // Use a security definer function to prevent infinite recursion
    const { data: familyData, error: familyError } = await supabase
      .rpc('create_family', { family_name: name });

    if (familyError) {
      console.error("Error creating family:", familyError);
      return {
        data: null,
        error: familyError.message,
        isError: true
      };
    }
    
    if (!familyData) {
      return {
        data: null,
        error: "No data returned when creating family",
        isError: true
      };
    }
    
    console.log("Family created successfully:", familyData);
    return {
      data: familyData as Family,
      error: null,
      isError: false
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Creating family",
      showToast: true
    });
    return {
      data: null,
      error: errorMessage,
      isError: true
    };
  }
}

/**
 * Invites a new member to a family
 * @param familyId The ID of the family to invite to
 * @param email The email of the person to invite
 * @param name The name of the person to invite
 * @param role The role to assign to the invited member
 * @returns Success or error information
 */
export async function inviteFamilyMember(
  familyId: string, 
  email: string, 
  name: string, 
  role: FamilyRole
) {
  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      return {
        success: false,
        error: "You must be logged in to invite members",
        isError: true
      };
    }
    
    // Use a security definer function to prevent infinite recursion
    const { error } = await supabase
      .rpc('invite_family_member', {
        p_family_id: familyId,
        p_email: email,
        p_name: name,
        p_role: role,
        p_invited_by: user.id
      });

    if (error) {
      console.error("Error sending invitation:", error);
      return {
        success: false,
        error: error.message,
        isError: true
      };
    }
    
    return {
      success: true,
      error: null,
      isError: false
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Inviting family member",
      showToast: true
    });
    return {
      success: false,
      error: errorMessage,
      isError: true
    };
  }
}
