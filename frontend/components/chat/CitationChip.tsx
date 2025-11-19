import Link from 'next/link';
import { Citation } from '@/lib/api';

/**
 * CitationChip Component
 * 
 * Small chip displaying a citation with link to the source note.
 * Clicking navigates to the full note viewer.
 * 
 * React Learning:
 * - Link component from Next.js for client-side navigation
 * - String manipulation (extracting note name from file path)
 * - Hover effects with Tailwind
 */
interface CitationChipProps {
  citation: Citation;
}

export default function CitationChip({ citation }: CitationChipProps) {
  // Extract note name from file path (e.g., "Spiritual/A New Earth/Note.md" -> "Note")
  const noteName = citation.title || extractNoteNameFromPath(citation.file_path);
  const category = citation.category || 'Unknown';
  
  // Calculate relevance percentage
  const relevancePercent = Math.round(citation.relevance_score * 100);

  // Generate link to note viewer (we'll implement this route later)
  const noteLink = `/notes/${encodeURIComponent(citation.file_path)}`;

  return (
    <Link
      href={noteLink}
      className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
      title={`Relevance: ${relevancePercent}% | ${citation.file_path}`}
    >
      {/* Category Icon */}
      <span>{getCategoryIcon(category)}</span>
      
      {/* Note Name */}
      <span className="max-w-[150px] truncate">{noteName}</span>
      
      {/* Relevance Badge */}
      <span className="bg-purple-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
        {relevancePercent}%
      </span>
    </Link>
  );
}

/**
 * Extract note name from file path
 */
function extractNoteNameFromPath(filePath: string): string {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.md$/, '');
}

/**
 * Get emoji icon for category
 */
function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    Spiritual: '🙏',
    'Self-Help': '💡',
    Psychology: '🧠',
    Science: '🔬',
    Philosophy: '📚',
    Mindfulness: '🧘',
    Productivity: '🎯',
    Relationships: '❤️',
  };
  return icons[category] || '📝';
}

