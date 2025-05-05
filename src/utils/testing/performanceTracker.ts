
/**
 * Utility for tracking test performance metrics
 */

interface PerformanceMarker {
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
}

export class PerformanceTracker {
  private markers: Map<string, PerformanceMarker> = new Map();
  private startTime: number;
  
  constructor() {
    this.startTime = performance.now();
  }
  
  /**
   * Start tracking a specific operation
   * @param name Name of the operation to track
   */
  start(name: string): void {
    if (this.markers.has(name)) {
      console.warn(`Performance marker '${name}' already exists and will be overwritten`);
    }
    
    this.markers.set(name, {
      name,
      startTime: performance.now()
    });
  }
  
  /**
   * End tracking a specific operation
   * @param name Name of the operation to track
   * @returns Duration in milliseconds
   */
  end(name: string): number {
    const marker = this.markers.get(name);
    
    if (!marker) {
      console.warn(`Performance marker '${name}' not found`);
      return 0;
    }
    
    marker.endTime = performance.now();
    marker.durationMs = marker.endTime - marker.startTime;
    
    return marker.durationMs;
  }
  
  /**
   * Get the total elapsed time since tracker creation
   */
  getTotalElapsedTime(): number {
    return performance.now() - this.startTime;
  }
  
  /**
   * Get all performance markers
   */
  getAllMarkers(): PerformanceMarker[] {
    return Array.from(this.markers.values());
  }
  
  /**
   * Generate a performance report in markdown format
   */
  generateReport(): string {
    const totalTime = this.getTotalElapsedTime();
    const markers = this.getAllMarkers();
    
    let report = '## Performance Metrics\n\n';
    report += `Total execution time: ${totalTime.toFixed(2)}ms\n\n`;
    
    if (markers.length > 0) {
      report += '| Operation | Duration (ms) | % of Total |\n';
      report += '|-----------|--------------|------------|\n';
      
      markers.forEach(marker => {
        if (marker.durationMs !== undefined) {
          const percentage = ((marker.durationMs / totalTime) * 100).toFixed(1);
          report += `| ${marker.name} | ${marker.durationMs.toFixed(2)} | ${percentage}% |\n`;
        } else {
          report += `| ${marker.name} | (incomplete) | - |\n`;
        }
      });
    } else {
      report += 'No performance markers were recorded.\n';
    }
    
    return report;
  }
  
  /**
   * Reset all performance markers
   */
  reset(): void {
    this.markers.clear();
    this.startTime = performance.now();
  }
}

/**
 * Create a new performance tracker instance
 */
export const createPerformanceTracker = (): PerformanceTracker => {
  return new PerformanceTracker();
};
