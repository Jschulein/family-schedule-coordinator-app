
import { TestConfig } from './types';

/**
 * Provides configuration for different test types
 */
export const getTestConfig = (testId: string): TestConfig => {
  switch (testId) {
    case "family-creation":
      return {
        title: "Family Creation Flow",
        description: "Tests the complete family creation flow from authentication to member registration"
      };
    case "family-members":
      return {
        title: "Family Members",
        description: "Tests the family members hook and data fetching functionality"
      };
    case "performance":
      return {
        title: "Performance Metrics",
        description: "Measures and compares performance of different data fetching strategies"
      };
    default:
      return {
        title: "Unknown Test",
        description: "No description available"
      };
  }
};
