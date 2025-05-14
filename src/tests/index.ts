
import { runEventTests } from './eventFlow';
import { testFamilyCreationFlow } from './familyFlow';

/**
 * Central test runner component
 * Exports all test functionality from a single location
 */
export { TestRunner } from '@/components/testing/TestRunner';

/**
 * Run all tests
 */
export async function runAllTests() {
  return {
    familyTests: await testFamilyCreationFlow(),
    eventTests: await runEventTests()
  };
}

export { testFamilyCreationFlow } from './familyFlow';
export { runEventTests } from './eventFlow';
