
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/utils/errorHandler";
import { Family, FamilyRole } from "@/types/familyTypes";

/**
 * Creates a new family in the database using the security definer function
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
      console.error("Authentication failed:", userErr?.message);
      return {
        data: null,
        error: "You must be logged in to create a family",
        isError: true
      };
    }

    console.log("User authenticated, creating family with user ID:", user.id);
    
    // Use the security definer function
    const { data, error: functionError } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: user.id 
      });

    if (functionError) {
      console.error("Error creating family:", functionError);
      return {
        data: null,
        error: functionError.message,
        isError: true
      };
    }
    
    if (!data) {
      console.error("No data returned from safe_create_family function");
      return {
        data: null,
        error: "No data returned when creating family",
        isError: true
      };
    }
    
    // Fetch the complete family data to return
    const familyId = data;
    console.log("Family created with ID:", familyId);
    const { data: familyData, error: fetchError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching created family:", fetchError);
      // We still return the family ID as it was created successfully
      return {
        data: { id: familyId, name, created_by: user.id } as Family,
        error: null,
        isError: false
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
    console.log(`Inviting member to family ${familyId}: ${name} (${email}) as ${role}`);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      console.error("Authentication failed:", userErr?.message);
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
    
    console.log("Invitation sent successfully");
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
