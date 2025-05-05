
/**
 * Family verification utilities
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";

/**
 * Verify that the family exists in the database
 */
export async function verifyFamilyInDatabase(familyId: string) {
  testLogger.info('VERIFY_FAMILY', 'Verifying family in database', { familyId });
  
  try {
    // Use direct query with no RLS dependencies
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
    
    // Use our dedicated security definer function to get family members
    const { data: members, error: membersError } = await supabase.rpc(
      'get_family_members_by_family_id',
      { p_family_id: familyId }
    );
    
    if (membersError) {
      testLogger.error('VERIFY_FAMILY', 'Failed to fetch family members', membersError);
      throw membersError;
    }
    
    testLogger.success('VERIFY_FAMILY', 'Family members found', { 
      count: members?.length || 0,
      members
    });
    
    // Check for creator member - there should be at least one member who is the creator
    const creatorMember = members?.find(m => m.role === 'admin');
    if (!creatorMember) {
      testLogger.warning('VERIFY_FAMILY', 'No admin members found for new family', { 
        familyId,
        members
      });
    } else {
      testLogger.success('VERIFY_FAMILY', 'Admin member found for family', { creatorMember });
    }
  } catch (error) {
    testLogger.error('VERIFY_FAMILY', 'Exception during family verification', error);
    throw error;
  }
}
