
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyRole } from "@/types/familyTypes";
import { handleError } from "@/utils/errorHandler";
import { FamilyServiceResponse } from "./types";

/**
 * Creates a new family in the database using the security definer function
 * @param name The name of the family to create
 * @returns The created family or an error
 */
export async function createFamily(name: string): Promise<FamilyServiceResponse<Family>> {
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
      console.error("Error creating family with RPC function:", functionError);
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
    console.log(`Family created successfully with ID: ${familyId}`);
    
    // Only send invitations if there are members to invite
    let invitationResults = null;
    if (members && members.length > 0) {
      // Get current user's email from the user object we already have
      const currentUserEmail = user.email;
      
      if (currentUserEmail) {
        console.log(`Current user email: ${currentUserEmail}`);
        
        // Filter out any members with the same email as the current user
        const filteredMembers = members.filter(member => 
          member.email.toLowerCase() !== currentUserEmail.toLowerCase()
        );
        
        console.log(`Original members: ${members.length}, Filtered members: ${filteredMembers.length}`);
        
        if (filteredMembers.length > 0) {
          const invitations = filteredMembers.map(member => ({
            family_id: familyId,
            email: member.email,
            name: member.name,
            role: member.role,
            invited_by: user.id,
            last_invited: new Date().toISOString()
          }));
          
          console.log(`Sending ${invitations.length} invitations`);
          
          const { data: invitationData, error: invitationError } = await supabase
            .from("invitations")
            .insert(invitations)
            .select();
          
          invitationResults = { data: invitationData, error: invitationError };
          
          if (invitationError) {
            console.error("Error sending invitations:", invitationError);
            // We continue even if invitations fail, as the family was created successfully
            return {
              data: { id: familyId, name, created_by: user.id } as Family,
              error: "Family created but there was an error inviting some members",
              isError: false
            };
          }
          
          console.log("Invitations sent successfully:", invitationData?.length || 0);
        } else {
          console.log("No members to invite after filtering out current user");
        }
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
