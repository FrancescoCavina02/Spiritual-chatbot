'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllBooks, BookMetadata, getNotes, Note } from '@/lib/api';

/**
 * Category Notes Page
 * 
 * Displays all books/notes in a specific category:
 * - Hierarchical categories: Show book grid (click book → view root note)
 * - Flat categories: Show note list directly
 * 
 * React Learning:
 * - Data fetching on mount
 * - Conditional rendering based on data structure
 * - Grid layouts with Tailwind CSS
 * 
 * Route: /notes/category/[category]
 * Example: /notes/category/Spiritual
 */

// Define which categories are flat vs hierarchical
const FLAT_CATEGORIES = ['Articles', 'Huberman Lab', 'Movies', 'Podcast'];

type SortOption = 'title-asc' | 'title-desc' | 'chapters-desc' | 'chapters-asc';

export default function CategoryNotesPage() {
  const params = useParams();
  const category = decodeURIComponent(params.category as string);
  
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [flatNotes, setFlatNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('title-asc');
  
  const isFlat = FLAT_CATEGORIES.includes(category);

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        setIsLoading(true);
        
        if (isFlat) {
          // Fetch flat notes for this category
          const notes = await getNotes(category);
          setFlatNotes(notes);
        } else {
          // Fetch book list for hierarchical category
          const allBooks = await getAllBooks();
          const categoryBooks = allBooks[category] || [];
          setBooks(categoryBooks);
        }
      } catch (err) {
        console.error('Error fetching category data:', err);
        setError('Failed to load category data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategoryData();
  }, [category, isFlat]);

  /**
   * Filter and sort books/notes
   * 
   * React Learning:
   * - useMemo to avoid re-calculating on every render
   * - Filter with .filter() method
   * - Sort with .sort() method
   * - Case-insensitive search with .toLowerCase()
   */
  const filteredAndSortedBooks = books
    .filter(book => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return book.title.toLowerCase().includes(query) ||
             book.book_name.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'chapters-desc':
          return b.chapter_count - a.chapter_count;
        case 'chapters-asc':
          return a.chapter_count - b.chapter_count;
        default:
          return 0;
      }
    });

  const filteredAndSortedNotes = flatNotes
    .filter(note => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return note.title.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  const displayedBooks = filteredAndSortedBooks;
  const displayedNotes = filteredAndSortedNotes;
  const totalItems = isFlat ? flatNotes.length : books.length;
  const displayedCount = isFlat ? displayedNotes.length : displayedBooks.length;
  const hasFilters = searchQuery !== '' || sortOption !== 'title-asc';

  const clearFilters = () => {
    setSearchQuery('');
    setSortOption('title-asc');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📚</div>
          <p className="text-gray-600">Loading {category} notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center space-y-6 py-12">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-bold text-red-600">{error}</h1>
        <Link
          href="/notes"
          className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          ← Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/notes" className="hover:text-purple-600 transition-colors">
            📚 Notes
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-800">{category}</span>
        </nav>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {category}
        </h1>
        
        <p className="text-gray-600">
          {isFlat
            ? `${totalItems} notes in this category`
            : `${totalItems} books in this category`}
        </p>
      </div>

      {/* Search and Sort Bar */}
      <div className="mb-6 bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFlat ? "Search notes..." : "Search books..."}
              className="w-full px-4 py-2 pl-10 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 transition-colors"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="md:w-64">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 transition-colors bg-white"
            >
              <option value="title-asc">Title (A → Z)</option>
              <option value="title-desc">Title (Z → A)</option>
              {!isFlat && (
                <>
                  <option value="chapters-desc">Most Chapters First</option>
                  <option value="chapters-asc">Fewest Chapters First</option>
                </>
              )}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Result Count */}
        <div className="mt-3 text-sm text-gray-600">
          {displayedCount === totalItems ? (
            <span>Showing all {totalItems} {isFlat ? 'notes' : 'books'}</span>
          ) : (
            <span className="font-semibold text-purple-600">
              Showing {displayedCount} of {totalItems} {isFlat ? 'notes' : 'books'}
            </span>
          )}
        </div>
      </div>

      {/* Hierarchical: Book Grid */}
      {!isFlat && displayedBooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBooks.map((book, index) => (
            <Link
              key={index}
              href={`/notes/${encodeURIComponent(book.file_path)}`}
              className="group block bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-purple-400"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                  📖
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                    {book.title}
                  </h2>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    {book.chapter_count > 0 && (
                      <p>📚 {book.chapter_count} chapters</p>
                    )}
                    <p className="text-purple-600 font-medium group-hover:underline">
                      Click to explore →
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Flat: Note List */}
      {isFlat && displayedNotes.length > 0 && (
        <div className="space-y-4">
          {displayedNotes.map((note, index) => (
            <Link
              key={index}
              href={`/notes/${encodeURIComponent(note.file_path)}`}
              className="group block bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-400"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">📄</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                    {note.title}
                  </h2>
                  {note.book && (
                    <p className="text-sm text-gray-600">
                      From: {note.book}
                    </p>
                  )}
                </div>
                <span className="text-purple-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Read →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {((isFlat && displayedNotes.length === 0) || (!isFlat && displayedBooks.length === 0)) && (
        <div className="text-center py-12 space-y-4">
          <div className="text-6xl">
            {totalItems === 0 ? '📭' : '🔍'}
          </div>
          <p className="text-xl text-gray-600">
            {totalItems === 0
              ? `No ${isFlat ? 'notes' : 'books'} found in this category`
              : `No ${isFlat ? 'notes' : 'books'} match your search`}
          </p>
          {totalItems === 0 ? (
            <Link
              href="/notes"
              className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              ← Back to Categories
            </Link>
          ) : (
            <button
              onClick={clearFilters}
              className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

