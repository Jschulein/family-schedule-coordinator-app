
/**
 * Markdown converter utilities for rendering formatted content
 * Used primarily by testing tools to display test results in HTML format
 */

/**
 * Converts markdown text to HTML for rendering in the UI
 * Handles headers, lists, bold text, code blocks, and line breaks
 * 
 * @param markdown The markdown text to convert
 * @returns HTML string representation of the markdown
 */
export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Lists
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
    // Bold
    .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
    // Code blocks
    .replace(/```json\n([\s\S]*?)```/gm, '<pre><code class="language-json">$1</code></pre>')
    // Line breaks
    .replace(/\n/gm, '<br />');
  
  return html;
}

/**
 * Extracts statistics from a markdown report
 * Parses the report to find error and warning counts
 * 
 * @param report The markdown report text
 * @returns Object containing extracted statistics
 */
export function extractReportStats(report: string): {
  errorCount: number;
  warningCount: number;
  success: boolean;
  hasWarnings: boolean;
} {
  const errorCount = parseInt(report.match(/Errors:\*\* (\d+)/)?.[1] || '0', 10);
  const warningCount = parseInt(report.match(/Warnings:\*\* (\d+)/)?.[1] || '0', 10);
  
  return {
    errorCount,
    warningCount,
    success: errorCount === 0,
    hasWarnings: warningCount > 0
  };
}
