'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchNotes, SearchResult } from '@/lib/api';
import Link from 'next/link';

/**
 * Advanced Search Page
 * 
 * Semantic search across entire knowledge base with:
 * - Natural language queries
 * - Category filters
 * - Relevance scoring
 * - Result snippets
 * - Direct links to notes
 * - Search state persistence (URL params + sessionStorage)
 * 
 * React Learning:
 * - Async search with loading states
 * - Category filtering
 * - Result ranking and display
 * - URL query parameters for shareable/bookmarkable searches
 * - sessionStorage for persisting results across navigation
 */

const CATEGORIES = [
  'All Categories',
  'Spiritual',
  'Science',
  'Self-Help',
  'Philosophy',
  'Mathematics',
  'General',
  'Fiction',
  'Podcast',
  'Huberman Lab',
  'YouTube Videos',
  'Movies',
  'Articles',
];

const STORAGE_KEY = 'search_results';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load search state from URL params and sessionStorage on mount
   */
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlCategory = searchParams.get('category');
    
    if (urlQuery) {
      setQuery(urlQuery);
      setSelectedCategory(urlCategory || 'All Categories');
      setHasSearched(true);
      
      // Load cached results from sessionStorage
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
          const cachedData = JSON.parse(cached);
          // Verify the cached results match current query
          if (cachedData.query === urlQuery && cachedData.category === urlCategory) {
            setResults(cachedData.results);
          } else {
            // Query changed, perform new search
            performSearch(urlQuery, urlCategory || 'All Categories');
          }
        } else {
          // No cache, perform search
          performSearch(urlQuery, urlCategory || 'All Categories');
        }
      } catch (err) {
        console.error('Error loading cached results:', err);
        performSearch(urlQuery, urlCategory || 'All Categories');
      }
    }
  }, [searchParams]);

  /**
   * Update URL params when search state changes
   */
  const updateURL = (newQuery: string, newCategory: string) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newCategory && newCategory !== 'All Categories') {
      params.set('category', newCategory);
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  /**
   * Save results to sessionStorage
   */
  const cacheResults = (searchQuery: string, category: string, searchResults: SearchResult[]) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        query: searchQuery,
        category,
        results: searchResults,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.error('Error caching results:', err);
    }
  };

  /**
   * Perform search (extracted for reuse)
   */
  const performSearch = async (searchQuery: string, category: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const categoryFilter = category === 'All Categories' ? undefined : category;

      const searchResults = await searchNotes({
        query: searchQuery.trim(),
        category: categoryFilter,
        top_k: 20,
      });

      setResults(searchResults);
      cacheResults(searchQuery, category, searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setHasSearched(true);
    updateURL(query.trim(), selectedCategory);
    await performSearch(query.trim(), selectedCategory);
  };

  /**
   * Get relevance score color based on score value
   */
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  /**
   * Format relevance score as percentage
   */
  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🔍 Semantic Search
        </h1>
        <p className="text-gray-600">
          Search across 1,649 notes using natural language. Our AI understands meaning, not just keywords.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-purple-200">
          {/* Search Input */}
          <div className="mb-4">
            <label htmlFor="search-input" className="block text-sm font-semibold text-gray-700 mb-2">
              What are you looking for?
            </label>
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'how to deal with anxiety' or 'meaning of consciousness'"
              className="w-full px-4 py-3 text-lg border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <label htmlFor="category-filter" className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by category (optional)
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                Searching...
              </>
            ) : (
              <>
                <span>🔍</span>
                Search
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !isLoading && (
        <div>
          {/* Result Count */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {results.length === 0
                ? 'No results found'
                : `${results.length} result${results.length > 1 ? 's' : ''} found`}
            </h2>
            {selectedCategory !== 'All Categories' && (
              <span className="text-sm text-gray-600">
                Filtered by: <span className="font-semibold text-purple-600">{selectedCategory}</span>
              </span>
            )}
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Link
                  key={index}
                  href={`/notes/${encodeURIComponent(result.file_path)}`}
                  className="block bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-400"
                >
                  {/* Result Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 hover:text-purple-600 transition-colors">
                        {result.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {/* Category Badge */}
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          📁 {result.category}
                        </span>
                        {/* Book Badge */}
                        {result.book && (
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            📖 {result.book}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Relevance Score */}
                    <div
                      className={`ml-4 px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(
                        result.relevance_score
                      )}`}
                      title="Relevance score"
                    >
                      {formatScore(result.relevance_score)}
                    </div>
                  </div>

                  {/* Snippet */}
                  <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                    ...{result.text}...
                  </p>

                  {/* Read More */}
                  <div className="mt-3 text-purple-600 text-sm font-medium flex items-center gap-1">
                    Read full note
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">
                Try different keywords or remove category filters
              </p>
              <div className="text-sm text-gray-500">
                <p className="font-semibold mb-2">Search tips:</p>
                <ul className="space-y-1">
                  <li>• Use natural language questions</li>
                  <li>• Try broader terms</li>
                  <li>• Check spelling</li>
                  <li>• Remove category filter to search everywhere</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial State (No search yet) */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl">
          <div className="text-6xl mb-4">💡</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Start Your Search</h3>
          <p className="text-gray-600 mb-6">
            Enter a question or topic above to find relevant notes
          </p>
          
          {/* Example Searches */}
          <div className="max-w-2xl mx-auto text-left">
            <p className="text-sm font-semibold text-gray-700 mb-3">Try these examples:</p>
            <div className="space-y-2">
              {[
                'What is the essence of mindfulness?',
                'How to deal with fear and anxiety?',
                'What does living in the present moment mean?',
                'How do I find my purpose?',
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(example)}
                  className="block w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm text-purple-700 transition-colors"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

