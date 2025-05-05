
/**
 * Types for the test runner components
 */

export interface TestResult {
  report: string;
  success: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
  executionTimeMs?: number;
  timestamp?: string;
}

export interface TestConfig {
  title: string;
  description: string;
}

export type TestResults = Record<string, TestResult | null>;
