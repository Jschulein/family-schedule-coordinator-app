
/**
 * Markdown conversion utilities
 * Provides functions to convert markdown to HTML and extract statistics
 */

/**
 * Converts markdown text to HTML
 * Simple implementation that handles basic markdown formatting
 * 
 * @param markdown The markdown text to convert
 * @returns HTML string representation of the markdown
 */
export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown
    // Convert headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    
    // Convert emphasis (bold, italic)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Convert lists
    .replace(/^\s*- (.*$)/gm, '<li>$1</li>')
    .replace(/<\/li>\n<li>/g, '</li>\n<li>')
    .replace(/<\/li>\n(?!<li>)/g, '</li></ul>\n')
    .replace(/(?<!<\/ul>\n)<li>/g, '<ul><li>')
    
    // Convert code blocks
    .replace(/```(\w*)\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
    
    // Convert inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Convert links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Convert paragraphs (must be done last)
    .replace(/(?<!\n<(h1|h2|h3|ul|ol|li|code|pre)>)(.*?)(?=\n|$)/gm, (match) => {
      return match.trim() ? `<p>${match.trim()}</p>` : '';
    });
    
  return html;
}
