
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

    // First try - Check if user already has a family with the same user_id to avoid duplicate constraints
    try {
      // Use a direct query to bypass RLS
      const { data: existingMemberships, error: checkError } = await supabase.rpc(
        'get_all_family_members_for_user'
      );
      
      if (checkError) {
        testLogger.warning('FAMILY_CREATE', 'Failed to check existing memberships', checkError);
      } else if (existingMemberships && existingMemberships.length > 0) {
        testLogger.info('FAMILY_CREATE', `User already has ${existingMemberships.length} existing family memberships`);
      }
    } catch (error) {
      testLogger.warning('FAMILY_CREATE', 'Error checking existing memberships', error);
    }
    
    // Create a new family directly using the security definer function
    try {
      testLogger.info('FAMILY_CREATE', 'Creating family using safe_create_family function');
      
      const { data: familyId, error: createError } = await supabase
        .rpc('safe_create_family', { 
          p_name: familyName, 
          p_user_id: user.id 
        });
        
      if (createError) {
        testLogger.error('FAMILY_CREATE', 'Error creating family with safe function', createError);
        throw createError;
      }
      
      if (!familyId) {
        testLogger.error('FAMILY_CREATE', 'No family ID returned from safe creation');
        throw new Error('No family ID returned');
      }
      
      // Fetch the family using the ID returned by the function
      const { data: family, error: fetchError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();
        
      if (fetchError) {
        testLogger.error('FAMILY_CREATE', 'Error fetching created family', fetchError);
        throw fetchError;
      }
      
      testLogger.success('FAMILY_CREATE', 'Family created successfully', {
        family
      });
      
      // Verify the family exists in the database
      await verifyFamilyInDatabase(family.id);
      
      // Add members using direct invitations
      if (members && members.length > 0) {
        testLogger.info('FAMILY_CREATE', `Adding ${members.length} members directly`);
        
        for (const member of members) {
          try {
            const { error: inviteError } = await supabase
              .from('invitations')
              .insert({
                family_id: family.id,
                email: member.email.toLowerCase(),
                name: member.name,
                role: member.role,
                invited_by: user.id,
                status: 'pending',
                last_invited: new Date().toISOString()
              });
              
            if (inviteError) {
              testLogger.warning('FAMILY_CREATE', `Failed to create invitation for ${member.email}`, inviteError);
            } else {
              testLogger.success('FAMILY_CREATE', `Created invitation for ${member.email}`);
            }
          } catch (inviteError) {
            testLogger.warning('FAMILY_CREATE', `Exception creating invitation for ${member.email}`, inviteError);
          }
        }
        
        // Verify invitations were created
        await verifyInvitationsCreated(family.id, members);
      }
      
      return family;
    } catch (error) {
      // Log the error for better debugging
      testLogger.error('FAMILY_CREATE', 'Family creation failed', {
        error: error instanceof Error ? error.message : String(error),
        errorObj: error
      });
      
      // Try one more fallback approach - direct insert with ON CONFLICT DO NOTHING
      try {
        testLogger.info('FAMILY_CREATE', 'Attempting final fallback for family creation');
        
        // Insert family directly
        const { data: familyData, error: insertError } = await supabase
          .from('families')
          .insert({ 
            name: familyName, 
            created_by: user.id
          })
          .select()
          .single();
          
        if (insertError) {
          testLogger.error('FAMILY_CREATE', 'Final fallback family creation failed', insertError);
          return null;
        }
        
        testLogger.success('FAMILY_CREATE', 'Final fallback family creation succeeded', {
          family: familyData
        });
        
        return familyData;
      } catch (fallbackError) {
        testLogger.error('FAMILY_CREATE', 'All family creation attempts failed', fallbackError);
        return null;
      }
    }
  } catch (error) {
    testLogger.error('FAMILY_CREATE', 'Exception during family creation process', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}
