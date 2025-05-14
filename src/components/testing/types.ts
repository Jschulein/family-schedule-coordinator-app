
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
  memoryUsage?: {
    used: number;
    total: number;
  };
}

export interface TestConfig {
  title: string;
  description: string;
  category?: 'core' | 'performance' | 'integration' | 'e2e';
  priority?: 'high' | 'medium' | 'low';
}

export type TestResults = Record<string, TestResult | null>;
