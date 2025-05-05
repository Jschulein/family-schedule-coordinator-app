/**
 * Direct family creation utility for testing
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";
import { verifyFamilyInDatabase } from "./verifyFamily";
import { verifyInvitationsCreated } from "./verifyInvitations";
import { FamilyMember } from "./types";

/**
 * Creates a family using direct database operations
 * Used as fallback when safe_create_family fails
 */
export async function createFamilyDirect(
  familyName: string,
  userId: string,
  userEmail: string | undefined,
  members?: FamilyMember[]
) {
  testLogger.info('DIRECT_FAMILY_CREATE', 'Attempting direct family creation', { familyName });

  try {
    const { data: directFamilyData, error: directError } = await supabase
      .from('families')
      .insert({ 
        name: familyName, 
        created_by: userId
      })
      .select()
      .maybeSingle();
      
    if (directError) {
      testLogger.error('DIRECT_FAMILY_CREATE', 'Direct family creation failed', directError);
      return { data: null, error: directError };
    }
    
    if (!directFamilyData) {
      const missingDataError = new Error('No family data returned from direct creation');
      testLogger.error('DIRECT_FAMILY_CREATE', 'No family data returned', missingDataError);
      return { data: null, error: missingDataError };
    }
    
    testLogger.success('DIRECT_FAMILY_CREATE', 'Direct family creation succeeded', {
      family: directFamilyData
    });
    
    // Create family_member record explicitly
    try {
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: directFamilyData.id,
          user_id: userId,
          email: userEmail?.toLowerCase() || '',
          role: 'admin',
          name: userEmail || ''
        });
        
      if (memberError) {
        // If member already exists, that's ok
        if (memberError.code === '23505') {
          testLogger.warning('DIRECT_FAMILY_CREATE', 'Family member already exists - continuing', {
            familyId: directFamilyData.id,
            userId
          });
        } else {
          testLogger.warning('DIRECT_FAMILY_CREATE', 'Error creating family member', memberError);
        }
      }
    } catch (memberErr) {
      testLogger.warning('DIRECT_FAMILY_CREATE', 'Exception creating family member', memberErr);
    }
    
    await verifyFamilyInDatabase(directFamilyData.id);
    
    // Add members by direct insertion to invitations
    if (members && members.length > 0) {
      await addFamilyMembers(directFamilyData.id, userId, members);
    }
    
    return { data: directFamilyData, error: null };
  } catch (error) {
    testLogger.error('DIRECT_FAMILY_CREATE', 'Exception during direct family creation', error);
    return { data: null, error };
  }
}

/**
 * Add family members through direct invitation creation
 */
async function addFamilyMembers(familyId: string, userId: string, members: FamilyMember[]) {
  testLogger.info('ADD_MEMBERS', `Adding ${members.length} members directly`);
  
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
        testLogger.warning('ADD_MEMBERS', `Failed to create invitation for ${member.email}`, inviteError);
      } else {
        testLogger.success('ADD_MEMBERS', `Created invitation for ${member.email}`);
      }
    } catch (inviteError) {
      testLogger.warning('ADD_MEMBERS', `Exception creating invitation for ${member.email}`, inviteError);
    }
  }
  
  // Verify invitations were created
  await verifyInvitationsCreated(familyId, members);
}
