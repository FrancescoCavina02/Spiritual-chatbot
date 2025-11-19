'use client';

import { Note } from '@/lib/api';
import MarkdownRenderer from './MarkdownRenderer';
import Link from 'next/link';

/**
 * NoteViewer Component
 * 
 * Displays a single note with:
 * - Breadcrumb navigation
 * - Metadata (category, book)
 * - Markdown content with [[links]]
 * - Related actions
 */
interface NoteViewerProps {
  note: Note;
}

export default function NoteViewer({ note }: NoteViewerProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/notes" className="hover:text-purple-600">
          Notes
        </Link>
        {note.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/notes/${encodeURIComponent(note.category)}`}
              className="hover:text-purple-600"
            >
              {note.category}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-800">{note.title}</span>
      </nav>

      {/* Note Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-t-2xl p-8 shadow-lg border-b border-purple-200">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          {note.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3">
          {note.category && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              📁 {note.category}
            </span>
          )}
          {note.book && (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
              📖 {note.book}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-3">
          <Link
            href={`/chat?context=${encodeURIComponent(note.id)}`}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow duration-200"
          >
            💬 Chat about this note
          </Link>
          <button className="px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200">
            🔍 Find related notes
          </button>
        </div>
      </div>

      {/* Note Content */}
      <div className="bg-white/50 backdrop-blur-sm rounded-b-2xl p-8 shadow-lg">
        <MarkdownRenderer content={note.content} />
      </div>

      {/* Related Links (if any) */}
      {note.links && note.links.length > 0 && (
        <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔗 Linked Notes</h2>
          <div className="flex flex-wrap gap-2">
            {note.links.map((link, index) => (
              <Link
                key={index}
                href={`/notes/${encodeURIComponent(link)}`}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm transition-colors duration-200"
              >
                [[{link}]]
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

