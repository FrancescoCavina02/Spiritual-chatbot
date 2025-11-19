import { Citation } from '@/lib/api';
import CitationChip from './CitationChip';

/**
 * CitationPanel Component
 * 
 * Sidebar panel showing all citations from the current AI response.
 * Displays source excerpts and allows navigation to full notes.
 */
interface CitationPanelProps {
  citations: Citation[];
}

export default function CitationPanel({ citations }: CitationPanelProps) {
  return (
    <div className="h-full overflow-y-auto bg-white/70 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">📚 Sources</h2>
        <p className="text-sm text-gray-600">
          {citations.length} reference{citations.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Citations List */}
      <div className="space-y-4">
        {citations.map((citation, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200 border border-purple-100"
          >
            {/* Citation Header */}
            <div className="flex items-center justify-between mb-2">
              <CitationChip citation={citation} />
              <span className="text-xs text-gray-400">#{index + 1}</span>
            </div>

            {/* Citation Excerpt */}
            <p className="text-sm text-gray-700 line-clamp-3 mt-2">
              {citation.snippet}
            </p>

            {/* Metadata */}
            {citation.book && (
              <p className="text-xs text-gray-500 mt-2">
                📖 {citation.book}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {citations.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-sm">Citations will appear here</p>
        </div>
      )}
    </div>
  );
}

