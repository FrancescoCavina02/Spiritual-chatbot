/**
 * Wiki Links Parser Utility
 * 
 * Handles Obsidian-style [[wiki links]] in markdown content.
 * Converts them to clickable Next.js Link components.
 */

/**
 * Extract all [[wiki links]] from markdown content
 */
export function extractWikiLinks(content: string): string[] {
  const wikiLinkPattern = /\[\[(.*?)\]\]/g;
  const matches = content.matchAll(wikiLinkPattern);
  return Array.from(matches, match => match[1].trim());
}

/**
 * Convert [[wiki links]] to a format suitable for rendering
 * Returns an array of content segments with metadata about links
 */
export interface ContentSegment {
  type: 'text' | 'link';
  content: string;
  linkText?: string; // Original link text for 'link' type
}

export function parseWikiLinks(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const wikiLinkPattern = /\[\[(.*?)\]\]/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = wikiLinkPattern.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }
    
    // Add the link
    segments.push({
      type: 'link',
      content: match[1].trim(),
      linkText: match[1].trim(),
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last link
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }
  
  // If no links found, return the entire content as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content,
    });
  }
  
  return segments;
}

/**
 * Replace [[wiki links]] with markdown links
 * Useful for markdown renderers that don't understand wiki syntax
 */
export function wikiLinksToMarkdown(content: string, baseUrl: string = '/notes'): string {
  return content.replace(/\[\[(.*?)\]\]/g, (match, linkText) => {
    const encodedLink = encodeURIComponent(linkText.trim());
    return `[${linkText.trim()}](${baseUrl}/${encodedLink})`;
  });
}

/**
 * Check if a string contains any [[wiki links]]
 */
export function hasWikiLinks(content: string): boolean {
  return /\[\[.*?\]\]/.test(content);
}

