'use client';

import { useState, KeyboardEvent } from 'react';
import { searchNotes, SearchResult } from '@/lib/api';
import Link from 'next/link';

/**
 * SearchBar Component
 * 
 * Semantic search across all notes with live results.
 * 
 * React Learning:
 * - Controlled input with useState
 * - Debouncing (optional enhancement)
 * - Dynamic result rendering
 * - Keyboard navigation
 */
interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Search notes with semantic AI...',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  /**
   * Handle search
   */
  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const searchResults = await searchNotes(query, 10);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle Enter key
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setShowResults(true)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-12 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors duration-200"
          />
          <span className="absolute left-4 top-3.5 text-xl">🔍</span>
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            isSearching || !query.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg'
          }`}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-purple-200 max-h-96 overflow-y-auto">
          {/* Close button */}
          <div className="sticky top-0 bg-white border-b border-purple-100 px-4 py-2 flex justify-between items-center">
            <span className="text-sm text-gray-600 font-semibold">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((result, index) => (
                <SearchResultItem
                  key={index}
                  result={result}
                  onClick={() => setShowResults(false)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🤔</div>
              <p>No results found. Try different keywords!</p>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}

/**
 * Individual Search Result Item
 */
function SearchResultItem({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  const relevancePercent = Math.round(result.relevance_score * 100);
  const noteLink = `/notes/${encodeURIComponent(result.metadata.file_path)}`;

  return (
    <Link href={noteLink} onClick={onClick}>
      <div className="p-4 hover:bg-purple-50 transition-colors duration-150 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">
              {result.metadata.title || extractNoteNameFromPath(result.metadata.file_path)}
            </h3>
            <p className="text-xs text-gray-500">
              {result.metadata.category && `📁 ${result.metadata.category}`}
              {result.metadata.book && ` • 📖 ${result.metadata.book}`}
            </p>
          </div>
          {/* Relevance Badge */}
          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
            {relevancePercent}%
          </span>
        </div>

        {/* Content Preview */}
        <p className="text-sm text-gray-600 line-clamp-2">{result.content}</p>
      </div>
    </Link>
  );
}

function extractNoteNameFromPath(filePath: string): string {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.replace(/\.md$/, '');
}

