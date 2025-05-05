/**
 * Secure family creation utility for testing
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";
import { verifyFamilyInDatabase } from "./verifyFamily";
import { verifyInvitationsCreated } from "./verifyInvitations";
import { FamilyMember } from "./types";

/**
 * Creates a family using the secure RPC function
 */
export async function createFamilySecure(
  familyName: string,
  userId: string,
  members?: FamilyMember[]
) {
  testLogger.info('SECURE_FAMILY_CREATE', 'Creating family using safe_create_family function');
  
  try {
    // Insert family using a security definer function
    const { data: familyData, error: insertError } = await supabase.rpc(
      'safe_create_family', 
      { 
        p_name: familyName, 
        p_user_id: userId 
      }
    );
    
    if (insertError) {
      testLogger.error('SECURE_FAMILY_CREATE', 'Error creating family with safe function', insertError);
      return { data: null, error: insertError };
    }
    
    if (!familyData) {
      const missingDataError = new Error('No family ID returned from safe creation');
      testLogger.error('SECURE_FAMILY_CREATE', 'No family ID returned', missingDataError);
      return { data: null, error: missingDataError };
    }
    
    const familyId = familyData;
    
    // Fetch the family using direct SQL to avoid RLS
    const { data: family, error: fetchError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .maybeSingle();
      
    if (fetchError) {
      testLogger.error('SECURE_FAMILY_CREATE', 'Error fetching created family', fetchError);
      return { data: null, error: fetchError };
    }
    
    if (!family) {
      const notFoundError = new Error('Family not found after creation');
      testLogger.error('SECURE_FAMILY_CREATE', 'Family not found after creation', notFoundError);
      return { data: null, error: notFoundError };
    }
    
    testLogger.success('SECURE_FAMILY_CREATE', 'Family created successfully', {
      family
    });
    
    // Verify the family exists in the database
    await verifyFamilyInDatabase(family.id);
    
    // Add members using direct invitations
    if (members && members.length > 0) {
      await addMembers(family.id, userId, members);
    }
    
    return { data: family, error: null };
  } catch (error) {
    testLogger.error('SECURE_FAMILY_CREATE', 'Exception during secure family creation', error);
    return { data: null, error };
  }
}

/**
 * Add members to a family using invitations
 */
async function addMembers(familyId: string, userId: string, members: FamilyMember[]) {
  testLogger.info('ADD_SECURE_MEMBERS', `Adding ${members.length} members directly`);
  
  for (const member of members) {
    try {
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          family_id: familyId,
          email: member.email.toLowerCase(),
          name: member.name,
          role: member.role,
          invited_by: userId,
          status: 'pending',
          last_invited: new Date().toISOString()
        });
        
      if (inviteError) {
        testLogger.warning('ADD_SECURE_MEMBERS', `Failed to create invitation for ${member.email}`, inviteError);
      } else {
        testLogger.success('ADD_SECURE_MEMBERS', `Created invitation for ${member.email}`);
      }
    } catch (inviteError) {
      testLogger.warning('ADD_SECURE_MEMBERS', `Exception creating invitation for ${member.email}`, inviteError);
    }
  }
  
  // Verify invitations were created
  await verifyInvitationsCreated(familyId, members);
}
