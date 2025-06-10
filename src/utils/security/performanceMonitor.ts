/**
 * Performance monitoring for security-sensitive operations
 */
import { performanceTracker } from "@/utils/testing";

export interface SecurityPerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: any;
}

export class SecurityPerformanceMonitor {
  private metrics: SecurityPerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics

  /**
   * Monitor a security operation's performance
   */
  async monitorOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const trackingId = performanceTracker.startMeasure(operation);
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.addMetric({
        operation,
        duration,
        timestamp: new Date(),
        success: true
      });
      
      // Log slow operations
      if (duration > 1000) { // 1 second threshold
        console.warn(`Slow security operation detected: ${operation} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.addMetric({
        operation,
        duration,
        timestamp: new Date(),
        success: false,
        error
      });
      
      throw error;
    } finally {
      performanceTracker.endMeasure(trackingId);
    }
  }

  /**
   * Add a performance metric
   */
  private addMetric(metric: SecurityPerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getOperationStats(operation: string) {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    
    if (operationMetrics.length === 0) {
      return null;
    }
    
    const durations = operationMetrics.map(m => m.duration);
    const successCount = operationMetrics.filter(m => m.success).length;
    
    return {
      operation,
      totalCalls: operationMetrics.length,
      successRate: (successCount / operationMetrics.length) * 100,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      lastCall: operationMetrics[operationMetrics.length - 1].timestamp
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats() {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    return operations.map(op => this.getOperationStats(op)).filter(Boolean);
  }

  /**
   * Get metrics from the last N minutes
   */
  getRecentMetrics(minutes: number = 10): SecurityPerformanceMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Detect performance anomalies
   */
  detectAnomalies(): string[] {
    const anomalies: string[] = [];
    const stats = this.getAllStats();
    
    stats.forEach(stat => {
      if (stat.successRate < 95) {
        anomalies.push(`Low success rate for ${stat.operation}: ${stat.successRate.toFixed(1)}%`);
      }
      
      if (stat.averageDuration > 2000) { // 2 seconds
        anomalies.push(`High average duration for ${stat.operation}: ${stat.averageDuration.toFixed(0)}ms`);
      }
      
      if (stat.maxDuration > 5000) { // 5 seconds
        anomalies.push(`Very slow operation detected for ${stat.operation}: ${stat.maxDuration}ms`);
      }
    });
    
    return anomalies;
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    const stats = this.getAllStats();
    const anomalies = this.detectAnomalies();
    
    let report = `# Security Performance Report\n\n`;
    
    if (stats.length === 0) {
      report += `No performance data available.\n`;
      return report;
    }
    
    report += `## Overview\n`;
    report += `- **Total Operations Monitored:** ${stats.length}\n`;
    report += `- **Total Calls:** ${stats.reduce((sum, s) => sum + s.totalCalls, 0)}\n`;
    report += `- **Anomalies Detected:** ${anomalies.length}\n\n`;
    
    if (anomalies.length > 0) {
      report += `## Performance Anomalies\n`;
      anomalies.forEach(anomaly => {
        report += `- ⚠️ ${anomaly}\n`;
      });
      report += '\n';
    }
    
    report += `## Operation Statistics\n\n`;
    stats.forEach(stat => {
      const emoji = stat.successRate >= 95 ? '✅' : '❌';
      report += `### ${emoji} ${stat.operation}\n`;
      report += `- **Total Calls:** ${stat.totalCalls}\n`;
      report += `- **Success Rate:** ${stat.successRate.toFixed(1)}%\n`;
      report += `- **Average Duration:** ${stat.averageDuration.toFixed(0)}ms\n`;
      report += `- **Duration Range:** ${stat.minDuration}ms - ${stat.maxDuration}ms\n`;
      report += `- **Last Call:** ${stat.lastCall.toISOString()}\n\n`;
    });
    
    return report;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }
}

export const securityPerformanceMonitor = new SecurityPerformanceMonitor();
