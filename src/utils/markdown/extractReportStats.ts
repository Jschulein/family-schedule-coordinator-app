
/**
 * Extracts test statistics from a markdown report
 * Used across various test reporting functions
 */

export interface ReportStats {
  success: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
}

/**
 * Extracts test statistics from a markdown report string
 * @param report The markdown report text
 * @returns Object containing statistics about errors and warnings
 */
export function extractReportStats(report: string): ReportStats {
  // Extract error and warning counts from the report using regex
  const errorCount = parseInt(report.match(/Errors:\*\* (\d+)/)?.[1] || '0', 10);
  const warningCount = parseInt(report.match(/Warnings:\*\* (\d+)/)?.[1] || '0', 10);
  
  return {
    success: errorCount === 0,
    hasWarnings: warningCount > 0,
    errorCount,
    warningCount
  };
}
