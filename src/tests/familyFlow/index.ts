
/**
 * Main entry point for family creation flow tests
 */
import { testLogger } from "@/utils/testLogger";
import { testAuthentication } from "./testAuthentication";
import { testFamilyCreation } from "./testFamilyCreation";
import { verifyNoDuplicateConstraints, verifyDatabaseConsistency } from "./verifyConstraints";

/**
 * Tests the complete family creation flow
 */
export async function testFamilyCreationFlow() {
  testLogger.clear();
  testLogger.info('INIT', 'Starting family creation flow test');
  
  try {
    // Test 1: Authentication
    const authResult = await testAuthentication();
    if (!authResult) {
      // If authentication failed, don't proceed with family creation tests
      testLogger.error('FAMILY_CREATE', 'Skipping family creation test due to authentication failure');
      return testLogger.generateReport();
    }
    
    // Test 2: Verify no existing database consistency issues
    try {
      await verifyDatabaseConsistency();
    } catch (error) {
      testLogger.error('VERIFY_CONSISTENCY', 'Database consistency verification failed, but continuing with tests', error);
      // Continue despite errors - we want to run as many tests as possible
    }
    
    // Test 3: Check for constraint issues before family creation
    try {
      await verifyNoDuplicateConstraints();
    } catch (error) {
      testLogger.error('VERIFY_CONSTRAINTS', 'Constraint verification failed, but continuing with tests', error);
      // Continue despite errors - we want to run as many tests as possible
    }
    
    // Test 4: Family Creation with Members
    const familyResult = await testFamilyCreation();
    if (!familyResult) {
      testLogger.error('FAMILY_CREATE', 'Family creation test failed');
      return testLogger.generateReport();
    }
    
    // Test 5: Verify no duplicate constraint violations after creation
    try {
      await verifyNoDuplicateConstraints();
    } catch (error) {
      testLogger.error('VERIFY_CONSTRAINTS', 'Post-creation constraint verification failed', error);
    }
    
    testLogger.success('OVERALL_TEST', 'All family creation flow tests completed');
  } catch (error) {
    testLogger.error('OVERALL_TEST', 'Unexpected error in family creation flow test', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
  
  // Generate and return report
  const report = testLogger.generateReport();
  console.log('REPORT:', report);
  return report;
}

// Re-export for backward compatibility
export { testFamilyCreationFlow as testFamilyFlow };
