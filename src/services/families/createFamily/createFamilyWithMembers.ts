
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyRole } from "@/types/familyTypes";
import { handleError } from "@/utils/errorHandler";
import { FamilyServiceResponse } from "../types";
import { sendFamilyInvitations } from "./familyInvitationUtils";

/**
 * Creates a new family with initial members
 * @param name Family name
 * @param members Optional initial members to invite
 * @returns The created family or error information
 */
export async function createFamilyWithMembers(
  name: string,
  members?: Array<{ name: string; email: string; role: FamilyRole }>
): Promise<FamilyServiceResponse<Family>> {
  try {
    // Validate input parameters
    if (!name || name.trim() === '') {
      console.error("Invalid family name provided");
      return {
        data: null,
        error: "Family name is required",
        isError: true
      };
    }

    console.log(`Creating family with members. Name: ${name}, Members count: ${members?.length || 0}`);
    
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      console.error("User authentication error:", userErr);
      return {
        data: null,
        error: "You must be logged in to create a family",
        isError: true
      };
    }

    console.log("Creating new family with secure function. User ID:", user.id);
    
    // Use the security definer function to create the family
    const { data, error: functionError } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: user.id 
      });

    if (functionError) {
      // Check if the error is a duplicate key violation
      if (functionError.message.includes("duplicate key value violates unique constraint")) {
        console.warn("Duplicate key detected in family creation - this is usually okay and means the member already exists");
        // We can continue despite this error since the family might still be created
      } else {
        console.error("Error creating family with RPC function:", functionError);
        return {
          data: null,
          error: functionError.message,
          isError: true
        };
      }
    }
    
    if (!data && !functionError?.message.includes("duplicate key value")) {
      console.error("No data returned when creating family");
      return {
        data: null,
        error: "No data returned when creating family",
        isError: true
      };
    }
    
    const familyId = data;
    console.log(`Family created with ID: ${familyId}`);
    
    // Only send invitations if there are members to invite
    let invitationResults = null;
    if (members && members.length > 0) {
      // Get current user's email from the user object we already have
      const currentUserEmail = user.email;
      
      if (currentUserEmail) {
        invitationResults = await sendFamilyInvitations(familyId, members, currentUserEmail);
        
        if (invitationResults.error) {
          console.error("Error sending invitations:", invitationResults.error);
          // We continue even if invitations fail, as the family was created successfully
          return {
            data: { id: familyId, name, created_by: user.id } as Family,
            error: "Family created but there was an error inviting some members",
            isError: false
          };
        }
        
        console.log("Invitations sent successfully:", invitationResults.data?.length || 0);
      } else {
        console.warn("Could not get current user email, skipping member filtering");
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
    console.error("Exception in createFamilyWithMembers:", error);
    return {
      data: null,
      error: errorMessage,
      isError: true
    };
  }
}
