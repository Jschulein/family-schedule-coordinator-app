
/**
 * Event flow tests
 * Exports all event-related test functionality
 */
import { testLogger } from '@/utils/testLogger';
import { testEventCreation } from './testEventCreation';

/**
 * Run all event-related tests
 */
export async function runEventTests() {
  testLogger.clear();
  testLogger.info('INIT', 'Starting event flow tests');
  
  try {
    // Test event creation
    const eventCreationResult = await testEventCreation();
    
    if (!eventCreationResult) {
      testLogger.error('EVENT_FLOW', 'Event creation test failed');
    } else {
      testLogger.success('EVENT_FLOW', 'All event creation tests passed');
    }
    
    testLogger.success('OVERALL_TEST', 'Event flow tests completed');
  } catch (error) {
    testLogger.error('OVERALL_TEST', 'Unexpected error in event flow tests', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
  
  // Generate and return the test report
  const report = testLogger.generateReport();
  console.log('EVENT TEST REPORT:', report);
  return report;
}

export * from './testEventCreation';
