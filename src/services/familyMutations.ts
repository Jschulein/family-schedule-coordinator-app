
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
    
    // Use direct table operations instead of RPC
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert({ 
        name: name, 
        created_by: user.id 
      })
      .select()
      .single();

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
    
    // Now add the creator as an admin to this family
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: familyData.id,
        user_id: user.id,
        email: user.email,
        role: 'admin',
        name: user.user_metadata?.full_name || user.email
      });
    
    if (memberError) {
      console.error("Error adding creator as family member:", memberError);
      // We still return the family since it was created successfully
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
    
    // Use direct table operations instead of RPC
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        family_id: familyId,
        email: email,
        name: name,
        role: role,
        invited_by: user.id,
        last_invited: new Date().toISOString()
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
