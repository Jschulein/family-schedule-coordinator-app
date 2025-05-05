
/**
 * Family creation testing module
 */
import { supabase } from "@/integrations/supabase/client";
import { createFamilyWithMembers } from "@/services/families";
import { testLogger } from "@/utils/testLogger";
import { verifyFamilyInDatabase } from "./verifyFamily";
import { verifyInvitationsCreated } from "./verifyInvitations";

/**
 * Test family creation flow
 */
export async function testFamilyCreation() {
  testLogger.info('FAMILY_CREATE', 'Testing family creation...');
  
  try {
    // Generate a unique family name using timestamp to avoid conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const familyName = `Test Family ${timestamp}`;
    
    // Create members with unique emails to avoid conflicts
    const members = [
      { name: 'Test Member 1', email: `member1.${timestamp}@example.com`, role: 'member' as const },
      { name: 'Test Member 2', email: `member2.${timestamp}@example.com`, role: 'admin' as const }
    ];
    
    testLogger.info('FAMILY_CREATE', 'Creating family with members', {
      name: familyName,
      members
    });
    
    // Test for potential duplicate emails before submission
    const emails = members.map(m => m.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    
    if (uniqueEmails.size !== members.length) {
      testLogger.warning('FAMILY_CREATE', 'Duplicate emails detected in test data', {
        emails,
        uniqueCount: uniqueEmails.size,
        totalCount: members.length
      });
    }
    
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
    return null;
  }
}
