
/**
 * Simple markdown to HTML converter for rendering test reports
 */
export function convertMarkdownToHtml(markdown: string): string {
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
