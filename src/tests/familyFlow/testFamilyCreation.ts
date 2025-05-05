
/**
 * Family creation testing module
 */
import { supabase } from "@/integrations/supabase/client";
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

    // First attempt: Create a completely new family using direct SQL to bypass RLS
    try {
      // Insert family directly using a transaction
      const { data: familyData, error: insertError } = await supabase.rpc(
        'safe_create_family', 
        { 
          p_name: familyName, 
          p_user_id: user.id 
        }
      );
      
      if (insertError) {
        // If there's a duplicate constraint or other error
        testLogger.error('FAMILY_CREATE', 'Error creating family with security definer function', insertError);
        
        // Try an alternative approach - direct insert
        const { data: directFamilyData, error: directError } = await supabase
          .from('families')
          .insert({ 
            name: familyName, 
            created_by: user.id
          })
          .select()
          .maybeSingle();
          
        if (directError) {
          testLogger.error('FAMILY_CREATE', 'Direct family creation failed', directError);
          throw directError;
        }
        
        if (!directFamilyData) {
          testLogger.error('FAMILY_CREATE', 'No family data returned from direct creation');
          throw new Error('No family data returned');
        }
        
        testLogger.success('FAMILY_CREATE', 'Direct family creation succeeded', {
          family: directFamilyData
        });
        
        // Create family_member record explicitly
        try {
          const { error: memberError } = await supabase
            .from('family_members')
            .insert({
              family_id: directFamilyData.id,
              user_id: user.id,
              email: user.email?.toLowerCase() || '',
              role: 'admin',
              name: user.user_metadata?.full_name || user.email || ''
            })
            .select()
            .maybeSingle();
            
          if (memberError) {
            // If member already exists, that's ok
            if (memberError.code === '23505') {
              testLogger.warning('FAMILY_CREATE', 'Family member already exists - continuing', {
                familyId: directFamilyData.id,
                userId: user.id
              });
            } else {
              testLogger.warning('FAMILY_CREATE', 'Error creating family member', memberError);
            }
          }
        } catch (memberErr) {
          testLogger.warning('FAMILY_CREATE', 'Exception creating family member', memberErr);
        }
        
        await verifyFamilyInDatabase(directFamilyData.id);
        
        // Add members by direct insertion to invitations
        if (members && members.length > 0) {
          testLogger.info('FAMILY_CREATE', `Adding ${members.length} members directly`);
          
          for (const member of members) {
            try {
              const { error: inviteError } = await supabase
                .from('invitations')
                .insert({
                  family_id: directFamilyData.id,
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
          await verifyInvitationsCreated(directFamilyData.id, members);
        }
        
        return directFamilyData;
      }
      
      if (!familyData) {
        testLogger.error('FAMILY_CREATE', 'No family ID returned from safe creation');
        throw new Error('No family ID returned');
      }
      
      const familyId = familyData;
      
      // Fetch the family using direct SQL to avoid RLS
      const { data: family, error: fetchError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .maybeSingle();
        
      if (fetchError) {
        testLogger.error('FAMILY_CREATE', 'Error fetching created family', fetchError);
        throw fetchError;
      }
      
      if (!family) {
        testLogger.error('FAMILY_CREATE', 'Family not found after creation');
        throw new Error('Family not found after creation');
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
      
      throw error;
    }
  } catch (error) {
    testLogger.error('FAMILY_CREATE', 'Exception during family creation process', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}
