
// Re-export everything from the family queries and mutations files
export * from "./familyQueries";
export * from "./familyMutations";

// Define consistent interface for family service operations
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyMember, FamilyRole } from "@/types/familyTypes";
import { handleError } from "@/utils/errorHandler";

/**
 * Creates a new family with initial members
 * @param name Family name
 * @param members Optional initial members to invite
 * @returns The created family or error information
 */
export async function createFamilyWithMembers(
  name: string,
  members?: Array<{ name: string; email: string; role: FamilyRole }>
) {
  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      return {
        data: null,
        error: "You must be logged in to create a family",
        isError: true
      };
    }

    console.log("Creating new family with secure function:", name);
    
    // Use the security definer function to create the family
    // This already adds the current user as a family member
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
      return {
        data: null,
        error: "No data returned when creating family",
        isError: true
      };
    }
    
    const familyId = data;
    
    // Filter out the current user from the members array to prevent duplicate insertion
    let filteredMembers = members;
    if (members && members.length > 0) {
      // Get current user's email to filter out
      const { data: { email } } = await supabase.auth.getUser();
      
      // Filter out any members with the same email as the current user
      filteredMembers = members.filter(member => 
        member.email.toLowerCase() !== email.toLowerCase()
      );
      
      console.log(`Inviting ${filteredMembers.length} members to family (filtered out current user)`);
      
      if (filteredMembers.length > 0) {
        const invitations = filteredMembers.map(member => ({
          family_id: familyId,
          email: member.email,
          name: member.name,
          role: member.role,
          invited_by: user.id,
          last_invited: new Date().toISOString()
        }));
        
        const { error: invitationError } = await supabase
          .from("invitations")
          .insert(invitations);
        
        if (invitationError) {
          console.error("Error sending invitations:", invitationError);
          // We continue even if invitations fail, as the family was created successfully
          return {
            data: { id: familyId, name, created_by: user.id } as Family,
            error: "Family created but there was an error inviting some members",
            isError: false
          };
        }
      }
    }
    
    // Fetch the complete family data to return
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
      context: "Creating family with members",
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
 * Resends an invitation to join a family
 * @param invitationId The ID of the invitation to resend
 * @returns Success status and error information
 */
export async function resendFamilyInvitation(invitationId: string) {
  try {
    const { error } = await supabase
      .from("invitations")
      .update({ last_invited: new Date().toISOString() })
      .eq("id", invitationId);

    if (error) {
      console.error("Error resending invitation:", error);
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
      context: "Resending invitation",
      showToast: true
    });
    return {
      success: false,
      error: errorMessage,
      isError: true
    };
  }
}

/**
 * Fetches the pending invitations for a specific family
 * @param familyId The ID of the family to fetch invitations for
 * @returns The pending invitations or error information
 */
export async function fetchFamilyInvitations(familyId: string) {
  try {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("family_id", familyId)
      .eq("status", "pending");

    if (error) {
      console.error("Error loading invitations:", error);
      return { 
        data: null, 
        error: error.message, 
        isError: true 
      };
    }
    
    return { 
      data, 
      error: null, 
      isError: false 
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Fetching family invitations",
      showToast: true
    });
    return { 
      data: null, 
      error: errorMessage, 
      isError: true 
    };
  }
}
