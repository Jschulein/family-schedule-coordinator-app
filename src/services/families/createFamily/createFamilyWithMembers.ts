
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

    // First, check if a family with this name already exists for this user to prevent duplicates
    const { data: existingFamily, error: checkError } = await supabase
      .from('families')
      .select('*')
      .eq('name', name)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (!checkError && existingFamily && existingFamily.length > 0) {
      console.log("Family with this name already exists:", existingFamily[0]);
      
      // If the family exists, just handle the members part
      if (members && members.length > 0 && user.email) {
        const invitationResults = await sendFamilyInvitations(
          existingFamily[0].id, 
          members, 
          user.email
        );
        
        if (invitationResults.error) {
          console.warn("Error sending invitations to existing family:", invitationResults.error);
        }
      }
      
      return {
        data: existingFamily[0] as Family,
        error: null,
        isError: false
      };
    }

    console.log("Creating new family with safe_create_family function. User ID:", user.id);
    
    // Use the security definer function to create the family - this bypasses RLS
    const { data, error: functionError } = await supabase
      .rpc('safe_create_family', { 
        p_name: name, 
        p_user_id: user.id 
      });

    if (functionError) {
      console.error("Error creating family with RPC function:", functionError);
      
      // Handle cases where the error is due to a constraint violation but the family was created
      if (functionError.message.includes("duplicate key value violates unique constraint") ||
          functionError.message.includes("violates row-level security policy")) {
        console.warn("Constraint violation detected - checking if family was still created");
        
        // Check if the family was actually created despite the error
        const { data: familiesCheck, error: checkError } = await supabase
          .from('families')
          .select('*')
          .eq('name', name)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!checkError && familiesCheck && familiesCheck.length > 0) {
          console.log("Family was created successfully despite constraint violation:", familiesCheck[0]);
          
          // Continue with invitations for this family
          const familyId = familiesCheck[0].id;
          
          if (members && members.length > 0 && user.email) {
            const invitationResults = await sendFamilyInvitations(familyId, members, user.email);
            
            if (invitationResults.error) {
              console.error("Error sending invitations:", invitationResults.error);
              // We continue even if invitations fail
              return {
                data: familiesCheck[0] as Family,
                error: "Family created but there was an error inviting some members",
                isError: false
              };
            }
          }
          
          return {
            data: familiesCheck[0] as Family,
            error: null,
            isError: false
          };
        }
      }
      
      return {
        data: null,
        error: functionError.message,
        isError: true
      };
    }
    
    if (!data) {
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
    if (members && members.length > 0 && user.email) {
      const invitationResults = await sendFamilyInvitations(familyId, members, user.email);
      
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
