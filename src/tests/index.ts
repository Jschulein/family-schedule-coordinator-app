
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

// Test runner component
export { default as TestRunner } from '@/components/testing/TestRunner';
