
import { supabase } from "@/integrations/supabase/client";
import { createFamilyWithMembers } from "@/services/families";
import { testLogger } from "@/utils/testLogger";

/**
 * Tests the complete family creation flow
 */
export async function testFamilyCreationFlow() {
  testLogger.clear();
  testLogger.info('INIT', 'Starting family creation flow test');
  
  // Test 1: Authentication
  await testAuthentication();
  
  // Test 2: Family Creation with Members
  await testFamilyCreation();
  
  // Generate and return report
  const report = testLogger.generateReport();
  console.log('REPORT:', report);
  return report;
}

/**
 * Test authentication flow
 */
async function testAuthentication() {
  testLogger.info('AUTH', 'Testing authentication...');
  
  try {
    // Check if user is already authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      testLogger.success('AUTH', 'User already authenticated', { 
        user_id: sessionData.session.user.id,
        email: sessionData.session.user.email
      });
      return true;
    }
    
    // If not, try to authenticate
    testLogger.info('AUTH', 'No active session found, attempting login');
    
    // Use test credentials - in a real app, these would come from a form
    // Note: These should be replaced with actual test credentials
    const email = 'test@example.com';
    const password = 'password123';
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      testLogger.error('AUTH', 'Authentication failed', error);
      throw error;
    }
    
    testLogger.success('AUTH', 'Authentication successful', {
      user: data.user?.id,
      email: data.user?.email
    });
    
    return true;
  } catch (error) {
    testLogger.error('AUTH', 'Exception during authentication', error);
    throw error;
  }
}

/**
 * Test family creation flow
 */
async function testFamilyCreation() {
  testLogger.info('FAMILY_CREATE', 'Testing family creation...');
  
  try {
    // Create a test family
    const familyName = `Test Family ${new Date().toISOString()}`;
    const members = [
      { name: 'Test Member 1', email: 'member1@example.com', role: 'member' as const },
      { name: 'Test Member 2', email: 'member2@example.com', role: 'admin' as const }
    ];
    
    testLogger.info('FAMILY_CREATE', 'Creating family with members', {
      name: familyName,
      members
    });
    
    const result = await createFamilyWithMembers(familyName, members);
    
    if (result.isError || !result.data) {
      testLogger.error('FAMILY_CREATE', 'Family creation failed', result);
      throw new Error(`Failed to create family: ${result.error}`);
    }
    
    testLogger.success('FAMILY_CREATE', 'Family created successfully', {
      family: result.data
    });
    
    // Verify the family exists in the database
    await verifyFamilyInDatabase(result.data.id);
    
    // Verify invitations were created
    await verifyInvitationsCreated(result.data.id, members);
    
    return result.data;
  } catch (error) {
    testLogger.error('FAMILY_CREATE', 'Exception during family creation', error);
    throw error;
  }
}

/**
 * Verify that the family exists in the database
 */
async function verifyFamilyInDatabase(familyId: string) {
  testLogger.info('VERIFY_FAMILY', 'Verifying family in database', { familyId });
  
  try {
    const { data: family, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
    
    if (error) {
      testLogger.error('VERIFY_FAMILY', 'Failed to fetch family from database', error);
      throw error;
    }
    
    if (!family) {
      testLogger.error('VERIFY_FAMILY', 'Family not found in database', { familyId });
      throw new Error(`Family not found in database: ${familyId}`);
    }
    
    testLogger.success('VERIFY_FAMILY', 'Family found in database', { family });
    
    // Verify family members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId);
    
    if (membersError) {
      testLogger.error('VERIFY_FAMILY', 'Failed to fetch family members', membersError);
      throw membersError;
    }
    
    testLogger.success('VERIFY_FAMILY', 'Family members found', { 
      count: members?.length,
      members
    });
  } catch (error) {
    testLogger.error('VERIFY_FAMILY', 'Exception during family verification', error);
    throw error;
  }
}

/**
 * Verify that invitations were created for family members
 */
async function verifyInvitationsCreated(familyId: string, members: Array<{name: string, email: string}>) {
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
