
/**
 * Testing utilities
 * Centralized exports for testing utilities
 * 
 * This file provides a central point for importing all testing utilities,
 * making it easier to maintain and extend testing capabilities
 * throughout the application.
 */

// Export performance tracking utilities
export * from './performanceTracker';

// Export test data generation utilities
export * from './testDataGenerator';

// Export random string generator
export * from './getRandomString';

// Export memory usage tracking for identifying resource issues
export const getMemoryUsage = (): { used: number, total: number } => {
  // In a browser environment, we can use performance.memory if available
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize
    };
  }
  
  // Fallback for environments without memory API
  return { used: 0, total: 0 };
};

// Simple function to help with time-based testing
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Format timestamp for consistent logging
export const formatTimestamp = (date: Date): string => {
  return date.toISOString().replace('T', ' ').substring(0, 19);
};
