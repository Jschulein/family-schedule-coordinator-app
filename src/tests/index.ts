
/**
 * Test module entry point
 * Re-exports all test functions for simplified imports
 */

// Family creation flow tests
export { testFamilyCreationFlow } from './familyFlow';

// Family members tests
export { 
  testFamilyMembersHook,
  testFamilyMembersPerformance
} from './useFamilyMembers.test';

// Export the TestRunner component from the new location
export { default as TestRunner } from '@/__tests__/components/TestRunner';
