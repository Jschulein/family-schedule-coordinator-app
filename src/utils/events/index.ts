
/**
 * Event utilities 
 * Centralized exports for all event-related utility functions
 */
export * from './eventFormatter';

/**
 * Debug utility for event creation flow
 * @param context The context where the log is coming from
 * @param message The message to log
 * @param data Optional data to log
 */
export function logEventFlow(context: string, message: string, data?: any) {
  console.log(`[EVENT FLOW][${context}] ${message}`, data || '');
}
