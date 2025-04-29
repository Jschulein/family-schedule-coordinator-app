
/**
 * Utility for logging test results and errors during testing
 */

type LogLevel = 'info' | 'success' | 'warning' | 'error';

interface LogEntry {
  step: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  details?: any;
}

class TestLogger {
  private logs: LogEntry[] = [];
  
  /**
   * Log a step in the test process
   */
  log(step: string, level: LogLevel, message: string, details?: any) {
    const entry: LogEntry = {
      step,
      level,
      message,
      timestamp: new Date(),
      details
    };
    
    this.logs.push(entry);
    
    // Also log to console for immediate feedback
    const emoji = this.getEmoji(level);
    console.log(`${emoji} [${step}] ${message}`, details || '');
    
    return this;
  }
  
  /**
   * Log an informational message
   */
  info(step: string, message: string, details?: any) {
    return this.log(step, 'info', message, details);
  }
  
  /**
   * Log a success message
   */
  success(step: string, message: string, details?: any) {
    return this.log(step, 'success', message, details);
  }
  
  /**
   * Log a warning message
   */
  warning(step: string, message: string, details?: any) {
    return this.log(step, 'warning', message, details);
  }
  
  /**
   * Log an error message
   */
  error(step: string, message: string, details?: any) {
    return this.log(step, 'error', message, details);
  }
  
  /**
   * Get the emoji for the log level
   */
  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
    }
  }
  
  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }
  
  /**
   * Generate a report of the test results
   */
  generateReport(): string {
    let report = '# Test Results Report\n\n';
    
    // Count by level
    const counts = {
      info: 0,
      success: 0,
      warning: 0,
      error: 0
    };
    
    this.logs.forEach(log => {
      counts[log.level]++;
    });
    
    report += `## Summary\n`;
    report += `- Total steps: ${this.logs.length}\n`;
    report += `- Successful: ${counts.success}\n`;
    report += `- Warnings: ${counts.warning}\n`;
    report += `- Errors: ${counts.error}\n`;
    report += `- Info: ${counts.info}\n\n`;
    
    report += `## Detailed Log\n\n`;
    
    this.logs.forEach((log, index) => {
      const emoji = this.getEmoji(log.level);
      report += `### Step ${index + 1}: ${log.step} ${emoji}\n`;
      report += `- **Level**: ${log.level}\n`;
      report += `- **Message**: ${log.message}\n`;
      report += `- **Time**: ${log.timestamp.toISOString()}\n`;
      
      if (log.details) {
        report += `- **Details**:\n\`\`\`json\n${JSON.stringify(log.details, null, 2)}\n\`\`\`\n`;
      }
      
      report += '\n';
    });
    
    return report;
  }
  
  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    return this;
  }
}

export const testLogger = new TestLogger();
