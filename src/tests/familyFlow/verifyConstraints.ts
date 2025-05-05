
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
    
    // Directly query family memberships to avoid RLS recursion
    const { data: memberships, error: membershipError } = await supabase.rpc(
      'get_all_family_members_for_user'
    );
    
    if (membershipError) {
      testLogger.error('VERIFY_CONSTRAINTS', 'Failed to fetch user family memberships', membershipError);
      return;
    }
    
    testLogger.info('VERIFY_CONSTRAINTS', `Found ${memberships?.length || 0} family memberships for current user`);
    
    // Check if any invitations exist with the same family_id and email
    if (memberships && memberships.length > 0) {
      let constraintIssues = 0;
      
      for (const membership of memberships) {
        // Use a direct query on invitations table
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
          constraintIssues++;
          testLogger.warning('VERIFY_CONSTRAINTS', 'Found potential conflict: user is both a member and has an invitation', {
            familyId: membership.family_id,
            email: userEmail,
            status: existingInvites[0].status,
            invitationCount: existingInvites.length
          });
          
          // For testing purposes, attempt to automatically resolve the conflict
          try {
            const { error: updateError } = await supabase
              .from('invitations')
              .update({ status: 'accepted' })
              .eq('family_id', membership.family_id)
              .eq('email', userEmail);
              
            if (updateError) {
              testLogger.error('VERIFY_CONSTRAINTS', 'Failed to resolve constraint conflict', updateError);
            } else {
              testLogger.success('VERIFY_CONSTRAINTS', 'Automatically resolved invitation conflict');
            }
          } catch (resolutionError) {
            testLogger.error('VERIFY_CONSTRAINTS', 'Exception during conflict resolution', resolutionError);
          }
        }
      }
      
      if (constraintIssues === 0) {
        testLogger.success('VERIFY_CONSTRAINTS', 'No potential constraint conflicts found');
      } else {
        testLogger.warning('VERIFY_CONSTRAINTS', `Found ${constraintIssues} potential constraint conflicts`);
      }
    } else {
      testLogger.info('VERIFY_CONSTRAINTS', 'User has no family memberships, skipping invitation conflict check');
    }
    
    // Use a direct query on families table that doesn't rely on RLS
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .select('id, name')
      .limit(100);
      
    if (familyError) {
      testLogger.error('VERIFY_CONSTRAINTS', 'Failed to fetch families for duplicate check', familyError);
    } else if (familyData && familyData.length > 0) {
      // Check each family for duplicate members, using our non-recursive function
      for (const family of familyData) {
        const { data: familyMembers, error: membersError } = await supabase.rpc(
          'get_family_members_by_family_id',
          { p_family_id: family.id }
        );
        
        if (membersError) {
          testLogger.error('VERIFY_CONSTRAINTS', `Failed to check for duplicate members in family ${family.name}`, membersError);
          continue;
        }
        
        // Check for duplicate email addresses
        const emailCounts = new Map<string, number>();
        familyMembers?.forEach(member => {
          const email = member.email.toLowerCase();
          emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
        });
        
        const duplicates = Array.from(emailCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([email]) => email);
          
        if (duplicates.length > 0) {
          testLogger.warning('VERIFY_CONSTRAINTS', `Found duplicate members in family ${family.name}`, {
            familyId: family.id,
            duplicateEmails: duplicates
          });
        }
      }
    }
    
    testLogger.success('VERIFY_CONSTRAINTS', 'Completed constraint violation checks');
  } catch (error) {
    testLogger.error('VERIFY_CONSTRAINTS', 'Exception during constraint verification', error);
  }
}

/**
 * Check and verify database consistency
 */
export async function verifyDatabaseConsistency() {
  testLogger.info('VERIFY_CONSISTENCY', 'Checking database consistency');
  
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      testLogger.warning('VERIFY_CONSISTENCY', 'No authenticated user found for consistency check');
      return;
    }
    
    // Use a direct query that doesn't rely on RLS
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, name, created_by, created_at')
      .limit(100);
      
    if (familiesError) {
      testLogger.error('VERIFY_CONSISTENCY', 'Failed to fetch families', familiesError);
      return;
    }
    
    if (families && families.length > 0) {
      testLogger.info('VERIFY_CONSISTENCY', `Found ${families.length} families to check`);
      
      for (const family of families) {
        // Use our new non-recursive function to check if family has members
        const { data: members, error: membersError } = await supabase.rpc(
          'get_family_members_by_family_id',
          { p_family_id: family.id }
        );
        
        if (membersError) {
          testLogger.error('VERIFY_CONSISTENCY', `Failed to fetch members for family ${family.name}`, membersError);
          continue;
        }
        
        if (!members || members.length === 0) {
          testLogger.warning('VERIFY_CONSISTENCY', `Family has no members: ${family.name}`, {
            familyId: family.id,
            createdBy: family.created_by,
            createdAt: family.created_at
          });
        }
      }
    }
    
    testLogger.success('VERIFY_CONSISTENCY', 'Completed database consistency checks');
  } catch (error) {
    testLogger.error('VERIFY_CONSISTENCY', 'Exception during consistency verification', error);
  }
}
