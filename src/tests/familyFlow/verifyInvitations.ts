
/**
 * Invitation verification utilities
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";

/**
 * Verify that invitations were created for family members
 */
export async function verifyInvitationsCreated(
  familyId: string, 
  members: Array<{name: string, email: string}>
) {
  testLogger.info('VERIFY_INVITATIONS', 'Verifying invitations created', {
    familyId,
    memberCount: members.length
  });
  
  try {
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) {
      testLogger.error('VERIFY_INVITATIONS', 'Failed to fetch invitations', error);
      throw error;
    }
    
    if (!invitations || invitations.length === 0) {
      testLogger.warning('VERIFY_INVITATIONS', 'No invitations found', { familyId });
      return;
    }
    
    // Check if all members have invitations
    const memberEmails = members.map(m => m.email.toLowerCase());
    const invitationEmails = invitations.map(i => i.email.toLowerCase());
    
    const missingInvitations = memberEmails.filter(
      email => !invitationEmails.includes(email)
    );
    
    if (missingInvitations.length > 0) {
      testLogger.warning('VERIFY_INVITATIONS', 'Some members do not have invitations', {
        missing: missingInvitations
      });
    } else {
      testLogger.success('VERIFY_INVITATIONS', 'All members have invitations', {
        invitationCount: invitations.length,
        invitations
      });
    }
  } catch (error) {
    testLogger.error('VERIFY_INVITATIONS', 'Exception during invitation verification', error);
    throw error;
  }
}
