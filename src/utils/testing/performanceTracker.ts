
/**
 * Performance tracking utilities for application monitoring and testing
 * 
 * This module provides tools for measuring and analyzing performance
 * metrics to identify bottlenecks and improve user experience.
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  totalDuration: number;
  averageDuration: number;
  startTime: number;
  endTime: number;
  memoryUsage: {
    used: number;
    total: number;
  };
  slowestOperation: {
    name: string;
    duration: number;
  } | null;
  fastestOperation: {
    name: string;
    duration: number;
  } | null;
}

/**
 * A utility to track and measure performance during test execution
 * and application runtime
 */
export class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private startTime: number = 0;
  private endTime: number = 0;
  private isTracking: boolean = false;

  /**
   * Start performance tracking session
   */
  startTracking(): void {
    this.metrics = [];
    this.startTime = performance.now();
    this.isTracking = true;
    console.log('[PerformanceTracker] Tracking started');
  }

  /**
   * Start measuring a specific operation
   * @param name - Name of the operation to measure
   * @param metadata - Optional metadata about the operation
   * @returns The name of the operation for use with endMeasure
   */
  startMeasure(name: string, metadata?: Record<string, any>): string {
    if (!this.isTracking) {
      console.warn('[PerformanceTracker] Tracking not started, call startTracking() first');
      this.startTracking();
    }
    
    this.metrics.push({
      name,
      startTime: performance.now(),
      metadata
    });
    
    return name;
  }

  /**
   * End measuring a specific operation
   * @param name - Name of the operation to end measuring
   * @returns The duration of the operation in milliseconds
   */
  endMeasure(name: string): number {
    const metricIndex = this.metrics.findIndex(m => m.name === name && m.endTime === undefined);
    
    if (metricIndex === -1) {
      console.warn(`[PerformanceTracker] No active measurement found for "${name}"`);
      return 0;
    }
    
    const now = performance.now();
    const metric = this.metrics[metricIndex];
    metric.endTime = now;
    metric.duration = now - metric.startTime;
    
    return metric.duration;
  }

  /**
   * Measure a function's execution time
   * @param name - Name of the operation
   * @param fn - Function to measure
   * @param metadata - Optional metadata about the operation
   * @returns The result of the function
   */
  async measure<T>(name: string, fn: () => Promise<T> | T, metadata?: Record<string, any>): Promise<T> {
    this.startMeasure(name, metadata);
    try {
      const result = await Promise.resolve(fn());
      return result;
    } finally {
      this.endMeasure(name);
    }
  }

  /**
   * Stop performance tracking and generate a report
   * @returns A report of all tracked metrics
   */
  stopTracking(): PerformanceReport {
    this.endTime = performance.now();
    this.isTracking = false;
    
    // Calculate total and average durations
    let totalDuration = 0;
    let operationCount = 0;
    let slowestOperation = null;
    let fastestOperation = null;
    
    for (const metric of this.metrics) {
      if (metric.duration !== undefined) {
        totalDuration += metric.duration;
        operationCount++;
        
        // Track slowest operation
        if (!slowestOperation || metric.duration > slowestOperation.duration) {
          slowestOperation = {
            name: metric.name,
            duration: metric.duration
          };
        }
        
        // Track fastest operation
        if (!fastestOperation || metric.duration < fastestOperation.duration) {
          fastestOperation = {
            name: metric.name,
            duration: metric.duration
          };
        }
      }
    }
    
    const averageDuration = operationCount > 0 ? totalDuration / operationCount : 0;
    
    // Get memory usage
    const memoryUsage = getMemoryUsage();
    
    console.log('[PerformanceTracker] Tracking stopped');
    
    return {
      metrics: this.metrics,
      totalDuration: this.endTime - this.startTime,
      averageDuration,
      startTime: this.startTime,
      endTime: this.endTime,
      memoryUsage,
      slowestOperation,
      fastestOperation
    };
  }

  /**
   * Get the current performance metrics without stopping tracking
   */
  getCurrentMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  /**
   * Clear all metrics but keep tracking active
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Export a singleton instance for app-wide use
export const performanceTracker = new PerformanceTracker();

// Helper function to get current memory usage
const getMemoryUsage = (): { used: number, total: number } => {
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

// Helper function to format performance time
export const formatExecutionTime = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  } else {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  }
};
