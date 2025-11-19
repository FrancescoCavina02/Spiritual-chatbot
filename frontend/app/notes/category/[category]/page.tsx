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

export default function CategoryNotesPage() {
  const params = useParams();
  const category = decodeURIComponent(params.category as string);
  
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [flatNotes, setFlatNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      <div className="mb-8">
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
            ? `${flatNotes.length} notes in this category`
            : `${books.length} books in this category`}
        </p>
      </div>

      {/* Hierarchical: Book Grid */}
      {!isFlat && books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book, index) => (
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
      {isFlat && flatNotes.length > 0 && (
        <div className="space-y-4">
          {flatNotes.map((note, index) => (
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
      {((isFlat && flatNotes.length === 0) || (!isFlat && books.length === 0)) && (
        <div className="text-center py-12 space-y-4">
          <div className="text-6xl">📭</div>
          <p className="text-xl text-gray-600">
            No {isFlat ? 'notes' : 'books'} found in this category
          </p>
          <Link
            href="/notes"
            className="inline-block px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            ← Back to Categories
          </Link>
        </div>
      )}
    </div>
  );
}

