
import { supabase } from "@/integrations/supabase/client";
import { Family, FamilyRole, FamilyServiceResponse } from "@/types/familyTypes";
import { handleError } from "@/utils/error";
import { performanceTracker } from "@/utils/testing";
import { validateFamilyName } from "./validators";
import { checkFamilyExists } from "./familyExistenceChecker";
import { createNewFamily } from "./familyCreator";
import { createSuccessResponse, createErrorResponse } from "./errorHandlers";

/**
 * Sends invitations to family members
 * @param familyId The ID of the family
 * @param members The members to invite
 * @param inviterEmail The email of the user sending the invitations
 * @returns The result of the invitation process
 */
async function sendFamilyInvitations(
  familyId: string,
  members: Array<{ name: string; email: string; role: FamilyRole }>,
  inviterEmail: string
): Promise<FamilyServiceResponse<any>> {
  try {
    console.log(`Sending invitations to ${members.length} members`);
    
    // This would be implemented to send invitations
    // For now, this is a stub implementation
    return createSuccessResponse({ count: members.length });
  } catch (error) {
    return createErrorResponse("Error sending invitations");
  }
}

/**
 * Validates and normalizes members data
 * @param members The members to validate
 * @returns The validated and normalized members
 */
function validateAndNormalizeMembers(
  members: Array<{ name: string; email: string; role: FamilyRole }>
): Array<{ name: string; email: string; role: FamilyRole }> {
  // Remove duplicates and validate
  const uniqueEmails = new Set();
  return members.filter(member => {
    const isDuplicate = uniqueEmails.has(member.email.toLowerCase());
    uniqueEmails.add(member.email.toLowerCase());
    return !isDuplicate && member.name && member.email && member.role;
  }).map(member => ({
    name: member.name,
    email: member.email.toLowerCase(),
    role: member.role
  }));
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
  // Track performance of this function
  const trackingId = performanceTracker.startMeasure('createFamilyWithMembers');
  
  try {
    // Validate input parameters
    const nameError = validateFamilyName(name);
    if (nameError) {
      return createErrorResponse(nameError);
    }

    console.log(`Creating family with members. Name: ${name}, Members count: ${members?.length || 0}`);
    
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      console.error("User authentication error:", userErr);
      return createErrorResponse("You must be logged in to create a family");
    }

    // First, check if a family with this name already exists for this user
    const existingFamily = await checkFamilyExists(name, user.id);
    if (existingFamily) {
      console.log("Found existing family with this name, using it instead of creating new one");
      // If the family exists, just handle the members part
      if (members && members.length > 0 && user.email) {
        const invitationResults = await sendFamilyInvitations(
          existingFamily.id, 
          members, 
          user.email
        );
        
        if (invitationResults.error) {
          console.warn("Error sending invitations to existing family:", invitationResults.error);
          return createSuccessResponse(
            existingFamily, 
            "Family found but there was an error inviting some members"
          );
        }
      }
      
      return createSuccessResponse(existingFamily);
    }

    // Create the new family
    const result = await createNewFamily(name, user.id);
    if (result.isError || !result.data) {
      if (result.error?.includes("duplicate key value")) {
        // Try to recover from duplicate key constraint error
        const recoveredFamily = await checkFamilyExists(name, user.id);
        if (recoveredFamily) {
          console.log("Recovered family after constraint error:", recoveredFamily);
          return createSuccessResponse(recoveredFamily, "Family created despite constraint warning");
        }
      }
      return result;
    }
    
    const createdFamily = result.data;
    
    // Only send invitations if there are members to invite
    if (members && members.length > 0 && user.email) {
      const normalizedMembers = validateAndNormalizeMembers(members);
      if (normalizedMembers.length > 0) {
        const invitationResults = await sendFamilyInvitations(
          createdFamily.id, 
          normalizedMembers, 
          user.email
        );
        
        if (invitationResults.error) {
          console.error("Error sending invitations:", invitationResults.error);
          // We continue even if invitations fail, as the family was created successfully
          return createSuccessResponse(
            createdFamily, 
            "Family created but there was an error inviting some members"
          );
        }
        
        console.log("Invitations sent successfully:", invitationResults.data?.length || 0);
      }
    }
    
    return createSuccessResponse(createdFamily);
  } catch (error: any) {
    const errorMessage = handleError(error, {
      context: "Creating family with members",
      showToast: true
    });
    console.error("Exception in createFamilyWithMembers:", error);
    return createErrorResponse(errorMessage);
  } finally {
    performanceTracker.endMeasure(trackingId);
  }
}
