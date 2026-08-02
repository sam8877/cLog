// ─── Markdown → HTML rendering service ─────────────────────

import { marked } from 'marked';
import hljs from 'highlight.js';

// Configure marked with highlight.js for code blocks
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Custom renderer to add syntax highlighting
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(text, { language: lang }).value;
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    } catch {
      // fall through
    }
  }
  // Escape for code block
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<pre><code>${escaped}</code></pre>`;
};

marked.use({ renderer });

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

// Simple markdown to plain text excerpt (strip all formatting)
export function stripMarkdown(md: string, maxLen: number = 200): string {
  let text = md
    .replace(/^#{1,6}\s+/gm, '')       // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')    // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/`([^`]+)`/g, '$1')        // inline code
    .replace(/```[\s\S]*?```/g, '')     // code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^>\s+/gm, '')             // blockquotes
    .replace(/^[-*+]\s+/gm, '')         // list markers
    .replace(/^\d+\.\s+/gm, '')         // ordered list
    .replace(/\n{2,}/g, ' ')            // multiple newlines → space
    .replace(/\n/g, ' ')                // single newline → space
    .replace(/\s{2,}/g, ' ')            // multiple spaces
    .trim();

  if (text.length > maxLen) {
    text = text.substring(0, maxLen).replace(/\s\S*$/, '') + '…';
  }

  return text || '（无内容）';
}
