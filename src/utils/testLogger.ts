
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
  private errorCount: number = 0;
  private warningCount: number = 0;
  private successCount: number = 0;
  
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
    
    // Update counters
    if (level === 'error') this.errorCount++;
    if (level === 'warning') this.warningCount++;
    if (level === 'success') this.successCount++;
    
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
    let report = '# Family Creation Flow Test Results\n\n';
    
    report += `## Summary\n`;
    report += `- **Total Steps:** ${this.logs.length}\n`;
    report += `- **Successful Steps:** ${this.successCount}\n`;
    report += `- **Warnings:** ${this.warningCount}\n`;
    report += `- **Errors:** ${this.errorCount}\n\n`;
    
    if (this.errorCount === 0 && this.warningCount === 0) {
      report += `### ✅ All Tests Passed Successfully\n\n`;
    } else if (this.errorCount > 0) {
      report += `### ❌ Test Failed with ${this.errorCount} errors\n\n`;
    } else {
      report += `### ⚠️ Test Passed with ${this.warningCount} warnings\n\n`;
    }
    
    report += `## Common Issues and Solutions\n\n`;
    if (this.errorCount > 0 || this.warningCount > 0) {
      // Document common errors and their solutions
      report += `### Database Constraint Violations\n`;
      report += `- **Issue:** Duplicate key value violates unique constraint "family_members_family_id_user_id_key"\n`;
      report += `- **Solution:** Added email normalization and duplicate filtering in the form submission process. Generated unique timestamps for test data.\n\n`;
      
      report += `### Authentication Issues\n`;
      report += `- **Issue:** Authentication may fail if test user doesn't exist\n`;
      report += `- **Solution:** Added proper error handling and instructions to create a test user if needed.\n\n`;
    } else {
      report += `No issues were encountered during this test run.\n\n`;
    }
    
    report += `## Detailed Log\n\n`;
    
    // Group logs by step categories for better organization
    const categories: Record<string, LogEntry[]> = {};
    this.logs.forEach(log => {
      if (!categories[log.step]) {
        categories[log.step] = [];
      }
      categories[log.step].push(log);
    });
    
    // Print logs by category
    Object.entries(categories).forEach(([category, logs]) => {
      report += `### ${category}\n`;
      
      logs.forEach((log, index) => {
        const emoji = this.getEmoji(log.level);
        report += `- ${emoji} **${log.level.toUpperCase()}**: ${log.message}\n`;
        
        if (log.details) {
          if (typeof log.details === 'string') {
            report += `  - Details: ${log.details}\n`;
          } else {
            report += `  - Details:\n\`\`\`json\n${JSON.stringify(log.details, null, 2)}\n\`\`\`\n`;
          }
        }
      });
      
      report += '\n';
    });
    
    // Add a section for test duration
    if (this.logs.length > 0) {
      const firstLogTime = this.logs[0].timestamp;
      const lastLogTime = this.logs[this.logs.length - 1].timestamp;
      const durationMs = lastLogTime.getTime() - firstLogTime.getTime();
      const durationSec = (durationMs / 1000).toFixed(2);
      
      report += `## Test Duration\n`;
      report += `- **Start Time:** ${firstLogTime.toISOString()}\n`;
      report += `- **End Time:** ${lastLogTime.toISOString()}\n`;
      report += `- **Total Duration:** ${durationSec} seconds\n\n`;
    }
    
    return report;
  }
  
  /**
   * Get success rate as percentage
   */
  getSuccessRate(): number {
    const totalStepsWithOutcome = this.successCount + this.errorCount;
    return totalStepsWithOutcome > 0 
      ? Math.round((this.successCount / totalStepsWithOutcome) * 100) 
      : 0;
  }
  
  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    this.errorCount = 0;
    this.warningCount = 0;
    this.successCount = 0;
    return this;
  }
}

export const testLogger = new TestLogger();
