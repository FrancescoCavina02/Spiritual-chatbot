/**
 * Markdown Utilities
 * 
 * Helper functions for processing Obsidian-style markdown,
 * particularly handling [[wiki links]] and other special syntax.
 */

/**
 * Convert Obsidian [[wiki links]] to markdown links
 * 
 * Transforms: [[Note Title]] → [Note Title](/notes/Note%20Title)
 * Transforms: [[Note Title|Display Text]] → [Display Text](/notes/Note%20Title)
 */
export function processObsidianLinks(markdown: string): string {
  // Match [[link]] or [[link|display text]]
  const wikiLinkRegex = /\[\[([^\]|]+)(\|([^\]]+))?\]\]/g;
  
  return markdown.replace(wikiLinkRegex, (match, notePath, _, displayText) => {
    const display = displayText || notePath;
    const encodedPath = encodeURIComponent(notePath.trim());
    return `[${display.trim()}](/notes/${encodedPath})`;
  });
}

/**
 * Extract title from markdown content
 * Looks for # heading or uses first line
 */
export function extractTitle(markdown: string): string {
  const lines = markdown.split('\n');
  
  // Look for first # heading
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.slice(2).trim();
    }
  }
  
  // Fallback to first non-empty line
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      return trimmed;
    }
  }
  
  return 'Untitled';
}

/**
 * Extract metadata from frontmatter
 * Obsidian notes often have YAML frontmatter like:
 * ---
 * category: Spiritual
 * book: A New Earth
 * ---
 */
export function extractFrontmatter(markdown: string): {
  content: string;
  metadata: { [key: string]: string };
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = markdown.match(frontmatterRegex);
  
  if (!match) {
    return { content: markdown, metadata: {} };
  }
  
  const frontmatter = match[1];
  const content = markdown.slice(match[0].length);
  const metadata: { [key: string]: string } = {};
  
  // Parse YAML-like key: value pairs
  frontmatter.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      metadata[key] = value;
    }
  });
  
  return { content, metadata };
}

/**
 * Highlight search terms in markdown
 */
export function highlightSearchTerms(markdown: string, searchTerms: string[]): string {
  let result = markdown;
  
  for (const term of searchTerms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    result = result.replace(regex, '**$1**');
  }
  
  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

