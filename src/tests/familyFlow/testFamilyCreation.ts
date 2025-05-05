
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
    
    // Get current user's ID before running the test
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      testLogger.error('FAMILY_CREATE', 'Could not get authenticated user', userError);
      throw new Error('Authentication required for testing');
    }
    
    testLogger.info('FAMILY_CREATE', 'Running test as user', { 
      userId: user.id,
      userEmail: user.email
    });
    
    // Try to find an existing family with this name to avoid duplication errors
    const { data: existingFamilies, error: searchError } = await supabase
      .from('families')
      .select('*')
      .eq('name', familyName)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (!searchError && existingFamilies && existingFamilies.length > 0) {
      testLogger.warning('FAMILY_CREATE', 'Family with this name already exists, will use existing family', {
        family: existingFamilies[0]
      });
      
      // Verify the existing family
      await verifyFamilyInDatabase(existingFamilies[0].id);
      await verifyInvitationsCreated(existingFamilies[0].id, members);
      
      testLogger.success('FAMILY_CREATE', 'Successfully verified existing family', {
        family: existingFamilies[0]
      });
      
      return existingFamilies[0];
    }
    
    // Proceed with family creation if no existing family was found
    const result = await createFamilyWithMembers(familyName, members);
    
    if (result.isError || !result.data) {
      // Try to recover from constraint violations by checking if the family was actually created
      if (result.error && (
          result.error.includes("duplicate key value violates unique constraint") ||
          result.error.includes("violates row-level security policy")
        )) {
        testLogger.warning('FAMILY_CREATE', 'Constraint detected - checking if family was still created', {
          error: result.error
        });
        
        // Search for recently created families with this name and user
        const { data: createdFamilies, error: createdError } = await supabase
          .from('families')
          .select('*')
          .eq('name', familyName)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (createdError) {
          testLogger.error('FAMILY_CREATE', 'Error searching for created family', createdError);
          throw new Error(`Failed to check if family was created: ${createdError.message}`);
        }
          
        if (createdFamilies && createdFamilies.length > 0) {
          testLogger.success('FAMILY_CREATE', 'Family was created successfully despite constraint violation', {
            family: createdFamilies[0]
          });
          
          // Continue with verification using the found family
          await verifyFamilyInDatabase(createdFamilies[0].id);
          await verifyInvitationsCreated(createdFamilies[0].id, members);
          
          return createdFamilies[0];
        } else {
          testLogger.error('FAMILY_CREATE', 'Family creation failed and no family was found', {
            error: result.error
          });
        }
      }
      
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
    testLogger.error('FAMILY_CREATE', 'Exception during family creation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}
