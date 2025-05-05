
/**
 * Main entry point for family creation flow tests
 */
import { testLogger } from "@/utils/testLogger";
import { testAuthentication } from "./testAuthentication";
import { testFamilyCreation } from "./testFamilyCreation";
import { verifyNoDuplicateConstraints } from "./verifyConstraints";

/**
 * Tests the complete family creation flow
 */
export async function testFamilyCreationFlow() {
  testLogger.clear();
  testLogger.info('INIT', 'Starting family creation flow test');
  
  // Test 1: Authentication
  const authResult = await testAuthentication();
  if (!authResult) {
    // If authentication failed, don't proceed with family creation tests
    testLogger.error('FAMILY_CREATE', 'Skipping family creation test due to authentication failure');
    return testLogger.generateReport();
  }
  
  // Test 2: Family Creation with Members
  const familyResult = await testFamilyCreation();
  if (!familyResult) {
    testLogger.error('FAMILY_CREATE', 'Family creation test failed');
    return testLogger.generateReport();
  }
  
  // Test 3: Verify no duplicate constraint violations
  await verifyNoDuplicateConstraints();
  
  // Generate and return report
  const report = testLogger.generateReport();
  console.log('REPORT:', report);
  return report;
}

// Re-export for backward compatibility
export { testFamilyCreationFlow as testFamilyFlow };
