
/**
 * Constraint verification utilities
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";

/**
 * Verify that no duplicate constraint violations would occur
 */
export async function verifyNoDuplicateConstraints() {
  testLogger.info('VERIFY_CONSTRAINTS', 'Checking for potential constraint violations');
  
  try {
    // Get current user's email to check for potential duplicates
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      testLogger.warning('VERIFY_CONSTRAINTS', 'No authenticated user found for constraint check');
      return;
    }
    
    const userEmail = user.email?.toLowerCase();
    
    // Get user's family memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('family_members')
      .select('family_id, email')
      .eq('user_id', user.id);
    
    if (membershipError) {
      testLogger.error('VERIFY_CONSTRAINTS', 'Failed to fetch user family memberships', membershipError);
      return;
    }
    
    // Check if any invitations exist with the same family_id and email
    if (memberships && memberships.length > 0) {
      for (const membership of memberships) {
        const { data: existingInvites, error: inviteError } = await supabase
          .from('invitations')
          .select('*')
          .eq('family_id', membership.family_id)
          .eq('email', userEmail);
          
        if (inviteError) {
          testLogger.error('VERIFY_CONSTRAINTS', 'Failed to check for duplicate invitations', inviteError);
          continue;
        }
        
        if (existingInvites && existingInvites.length > 0) {
          testLogger.warning('VERIFY_CONSTRAINTS', 'Found potential conflict: user is both a member and has an invitation', {
            familyId: membership.family_id,
            email: userEmail,
            invitations: existingInvites
          });
        }
      }
    }
    
    testLogger.success('VERIFY_CONSTRAINTS', 'Completed constraint violation checks');
  } catch (error) {
    testLogger.error('VERIFY_CONSTRAINTS', 'Exception during constraint verification', error);
  }
}
