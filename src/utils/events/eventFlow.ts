
/**
 * Event flow logging and tracking utilities
 * Provides consistent logging and performance tracking for event-related operations
 */

import { performanceTracker } from "@/utils/testing/performanceTracker";

/**
 * Log an event flow step with performance tracking
 * @param component The component or service where the event occurred
 * @param message A descriptive message about what happened
 * @param data Additional data relevant to the event
 */
export function logEventFlow(component: string, message: string, data?: any): void {
  // Create a consistent format for event flow logs
  const timestamp = new Date().toISOString();
  const formattedMessage = `[EVENT FLOW][${component}] ${message}`;
  
  // Log to console for debugging
  if (data) {
    console.log(formattedMessage, data);
  } else {
    console.log(formattedMessage);
  }
  
  // Track event in performance system
  performanceTracker.measure(`EventFlow:${component}:${message.replace(/\s+/g, '_')}`, 
    // Empty function as we're using this for labeling/marking events rather than timing
    () => {},
    // Include metadata for analysis
    { 
      component, 
      message, 
      timestamp,
      data
    }
  );
}

/**
 * Get a summary of event flow performance for a specific component or operation
 * @param component Optional component name to filter results
 * @returns Performance metrics for the event flow
 */
export function getEventFlowPerformanceSummary(component?: string): Record<string, any> {
  const metrics = performanceTracker.getCurrentMetrics();
  
  // Filter metrics by event flow and optionally by component
  const eventFlowMetrics = metrics.filter(metric => 
    metric.name.startsWith('EventFlow:') && 
    (!component || metric.name.startsWith(`EventFlow:${component}`))
  );
  
  // Process metrics into a more useful summary
  const summary = {
    totalEvents: eventFlowMetrics.length,
    eventsByComponent: {} as Record<string, number>,
    averageDuration: 0,
    slowestOperation: null as string | null,
    fastestOperation: null as string | null,
  };
  
  // Calculate stats
  if (eventFlowMetrics.length > 0) {
    // Count events by component
    eventFlowMetrics.forEach(metric => {
      const componentName = metric.name.split(':')[1];
      summary.eventsByComponent[componentName] = (summary.eventsByComponent[componentName] || 0) + 1;
    });
    
    // Calculate timings
    const completedMetrics = eventFlowMetrics.filter(m => m.duration !== undefined);
    if (completedMetrics.length > 0) {
      const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
      summary.averageDuration = totalDuration / completedMetrics.length;
      
      // Find slowest and fastest
      let slowest = completedMetrics[0];
      let fastest = completedMetrics[0];
      
      completedMetrics.forEach(m => {
        if (m.duration && slowest.duration && m.duration > slowest.duration) {
          slowest = m;
        }
        if (m.duration && fastest.duration && m.duration < fastest.duration) {
          fastest = m;
        }
      });
      
      summary.slowestOperation = slowest.name;
      summary.fastestOperation = fastest.name;
    }
  }
  
  return summary;
}
