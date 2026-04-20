'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchNotes, SearchResult } from '@/lib/api';
import Link from 'next/link';

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

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlCategory = searchParams.get('category');
    
    if (urlQuery) {
      setQuery(urlQuery);
      setSelectedCategory(urlCategory || 'All Categories');
      setHasSearched(true);
      
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
          const cachedData = JSON.parse(cached);
          if (cachedData.query === urlQuery && cachedData.category === urlCategory) {
            setResults(cachedData.results);
          } else {
            performSearch(urlQuery, urlCategory || 'All Categories');
          }
        } else {
          performSearch(urlQuery, urlCategory || 'All Categories');
        }
      } catch (err) {
        console.error('Error loading cached results:', err);
        performSearch(urlQuery, urlCategory || 'All Categories');
      }
    }
  }, [searchParams]);

  const updateURL = (newQuery: string, newCategory: string) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newCategory && newCategory !== 'All Categories') {
      params.set('category', newCategory);
    }
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

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
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to perform search. Please try again.';
      setError(errorMessage);
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

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-teal-700 bg-teal-100';
    if (score >= 0.6) return 'text-emerald-700 bg-emerald-100';
    if (score >= 0.4) return 'text-amber-700 bg-amber-100';
    return 'text-stone-600 bg-stone-100';
  };

  const formatScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent mb-3 pb-1">
          Semantic Search
        </h1>
        <p className="text-stone-600 text-lg">
          Search across 1,649 notes using natural language. The AI understands meaning, not just keywords.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-10">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-stone-200">
          {/* Search Input */}
          <div className="mb-5">
            <label htmlFor="search-input" className="block text-sm font-semibold text-stone-700 mb-2">
              What are you looking for?
            </label>
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'how to deal with anxiety' or 'meaning of consciousness'"
              className="w-full px-5 py-4 text-lg border border-stone-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all bg-white text-stone-800 placeholder-stone-400 shadow-sm"
              autoFocus
            />
          </div>

          <div className="md:flex gap-4 items-end">
            {/* Category Filter */}
            <div className="mb-4 md:mb-0 md:w-1/3">
              <label htmlFor="category-filter" className="block text-sm font-semibold text-stone-700 mb-2">
                Filter by category
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white text-stone-800 shadow-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="md:w-2/3">
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-teal-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></span>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 shadow-sm">
          <p className="font-semibold text-red-800">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !isLoading && (
        <div className="space-y-6 animate-fade-in">
          {/* Result Count */}
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h2 className="text-xl font-bold text-stone-800">
              {results.length === 0
                ? 'No results found'
                : `${results.length} result${results.length > 1 ? 's' : ''} found`}
            </h2>
            {selectedCategory !== 'All Categories' && (
              <span className="text-sm text-stone-600 bg-stone-100 px-3 py-1 rounded-full">
                Filtered by: <span className="font-semibold text-teal-700">{selectedCategory}</span>
              </span>
            )}
          </div>

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-5">
              {results.map((result, index) => (
                <Link
                  key={index}
                  href={`/notes/${encodeURIComponent(result.file_path)}`}
                  className="block bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-stone-200 hover:border-teal-400 group"
                >
                  {/* Result Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-lg font-bold text-stone-800 mb-2 group-hover:text-teal-700 transition-colors line-clamp-1">
                        {result.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {/* Category Badge */}
                        <span className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded-md text-xs font-semibold">
                          {result.category}
                        </span>
                        {/* Book Badge */}
                        {result.book && (
                          <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-md text-xs font-semibold">
                            📖 {result.book}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Relevance Score */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getScoreColor(
                        result.relevance_score
                      )}`}
                      title="Relevance score (cosine similarity + hybrid signals)"
                    >
                      {formatScore(result.relevance_score)}
                    </div>
                  </div>

                  {/* Snippet */}
                  <div className="text-stone-600 text-sm leading-relaxed mt-4 bg-stone-50/50 p-4 rounded-lg border border-stone-100 italic relative">
                    <span className="absolute -left-2 top-0 text-3xl text-stone-200 leading-none">"</span>
                    {result.text}
                    <span className="absolute -right-2 bottom-0 text-3xl text-stone-200 leading-none rotate-180">"</span>
                  </div>

                  {/* Footer interaction CTA */}
                  <div className="mt-4 flex justify-end">
                    <span className="text-sm font-medium text-teal-600 group-hover:text-teal-800 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                      Read full note
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-stone-100 shadow-sm">
              <div className="text-5xl mb-4 opacity-50">🔍</div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">No relevant passages found</h3>
              <p className="text-stone-600 mb-4 max-w-md mx-auto">
                The RAG pipeline couldn't find chunks matching this semantic query. Try different keywords or broader concepts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial State (No search yet) */}
      {!hasSearched && !isLoading && (
        <div className="mt-8 animate-fade-in">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4 text-center">
            Example Semantic Queries
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {[
              'The nature of consciousness and ego',
              'Protocols for increasing motivation and drive',
              'What does wu wei (non-action) mean in practice?',
              'Overcoming fear and living in the present',
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="text-left px-5 py-4 bg-white/60 hover:bg-white border border-stone-200 hover:border-teal-200 rounded-xl text-sm font-medium text-stone-700 transition-colors shadow-sm hover:shadow-md group"
              >
                <span className="text-teal-600 mr-2 group-hover:font-bold transition-all">"</span>
                {example}
                <span className="text-teal-600 ml-1 group-hover:font-bold transition-all">"</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-20 text-center text-stone-500 animate-pulse text-lg">Loading semantic search module...</div>}>
      <SearchContent />
    </Suspense>
  );
}
