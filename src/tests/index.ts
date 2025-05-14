
import { runEventTests } from './eventFlow';
import { testFamilyCreation } from './familyFlow';

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
    familyTests: await testFamilyCreation(),
    eventTests: await runEventTests()
  };
}

export { testFamilyCreation } from './familyFlow';
export { runEventTests } from './eventFlow';
