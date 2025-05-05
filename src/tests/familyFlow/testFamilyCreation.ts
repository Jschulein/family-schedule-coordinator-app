/**
 * Family creation testing module
 */
import { supabase } from "@/integrations/supabase/client";
import { testLogger } from "@/utils/testLogger";
import { createFamilySecure } from "./createFamilySecure";
import { createFamilyDirect } from "./createFamilyDirect";
import { createFamilyFallback } from "./createFamilyFallback";
import { FamilyMember } from "./types";

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

    // Try each family creation method in sequence until one succeeds
    
    // Method 1: Try secure creation first
    const { data: secureFamily, error: secureError } = await createFamilySecure(
      familyName,
      user.id,
      members
    );
    
    if (!secureError && secureFamily) {
      return secureFamily;
    }
    
    // Method 2: Try direct creation if secure method fails
    const { data: directFamily, error: directError } = await createFamilyDirect(
      familyName,
      user.id,
      user.email,
      members
    );
    
    if (!directError && directFamily) {
      return directFamily;
    }
    
    // Method 3: Final fallback if all else fails
    try {
      return await createFamilyFallback(familyName, user.id);
    } catch (error) {
      testLogger.error('FAMILY_CREATE', 'All family creation methods failed', {
        secureError,
        directError,
        finalError: error
      });
      return null;
    }
  } catch (error) {
    testLogger.error('FAMILY_CREATE', 'Exception during family creation process', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}
