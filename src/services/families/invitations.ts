
import { supabase } from "@/integrations/supabase/client";
import { FamilyRole } from "@/types/familyTypes";
import { handleError } from "@/utils/error";
import { FamilyInvitation, FamilyServiceResponse } from "./types";

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
): Promise<FamilyServiceResponse<boolean>> {
  try {
    console.log(`Inviting member to family ${familyId}: ${name} (${email}) as ${role}`);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      console.error("Authentication failed:", userErr?.message);
      return {
        data: null,
        error: "You must be logged in to invite members",
        isError: true
      };
    }
    
    // Use direct table operations instead of RPC
    const { error } = await supabase
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
        data: null,
        error: error.message,
        isError: true
      };
    }
    
    console.log("Invitation sent successfully");
    return {
      data: true,
      error: null,
      isError: false
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Inviting family member",
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
export async function resendFamilyInvitation(invitationId: string): Promise<FamilyServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from("invitations")
      .update({ last_invited: new Date().toISOString() })
      .eq("id", invitationId);

    if (error) {
      console.error("Error resending invitation:", error);
      return {
        data: null,
        error: error.message,
        isError: true
      };
    }
    
    return {
      data: true,
      error: null,
      isError: false
    };
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Resending invitation",
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
 * Fetches the pending invitations for a specific family
 * @param familyId The ID of the family to fetch invitations for
 * @returns The pending invitations or error information
 */
export async function fetchFamilyInvitations(familyId: string): Promise<FamilyServiceResponse<FamilyInvitation[]>> {
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
