'use client';

import { Note, NavigationContext, BreadcrumbItem } from '@/lib/api';
import MarkdownRenderer from './MarkdownRenderer';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getNoteNavigation } from '@/lib/api';
import { wikiLinksToMarkdown } from '@/lib/wikilinks';

/**
 * NoteViewer Component with Tree Navigation
 * 
 * Displays a single note with:
 * - Hierarchical breadcrumb navigation
 * - Parent/sibling navigation
 * - Markdown content with [[wiki links]]
 * - Child notes as clickable cards
 * - Quick actions
 * 
 * React Learning:
 * - State management with useState
 * - Side effects with useEffect
 * - Conditional rendering
 * - Dynamic navigation based on tree structure
 */
interface NoteViewerProps {
  note: Note;
}

export default function NoteViewer({ note }: NoteViewerProps) {
  const [navContext, setNavContext] = useState<NavigationContext | null>(null);
  const [isLoadingNav, setIsLoadingNav] = useState(true);

  // Fetch navigation context when note changes
  useEffect(() => {
    async function fetchNavigation() {
      try {
        setIsLoadingNav(true);
        const context = await getNoteNavigation(note.file_path);
        setNavContext(context);
      } catch (error) {
        console.error('Failed to fetch navigation context:', error);
        // Continue showing note even if navigation fails
        setNavContext(null);
      } finally {
        setIsLoadingNav(false);
      }
    }

    fetchNavigation();
  }, [note.file_path]);

  // Convert [[wiki links]] to markdown links for rendering
  const contentWithLinks = wikiLinksToMarkdown(note.content, '/notes');

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      {!isLoadingNav && navContext && navContext.breadcrumbs.length > 0 && (
        <nav className="mb-6 text-sm text-gray-600 flex items-center flex-wrap gap-2">
          <Link href="/notes" className="hover:text-purple-600 transition-colors">
            🏠 Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link 
            href={`/notes/category/${encodeURIComponent(note.category)}`}
            className="hover:text-purple-600 transition-colors"
          >
            {note.category}
          </Link>
          {navContext.breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              <span className="text-gray-400">/</span>
              {index === navContext.breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-800">{crumb.title}</span>
              ) : (
                <Link
                  href={`/notes/${encodeURIComponent(crumb.file_path)}`}
                  className="hover:text-purple-600 transition-colors"
                >
                  {crumb.title}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Parent/Back Navigation */}
      {!isLoadingNav && navContext && navContext.parent && (
        <div className="mb-4">
          <Link
            href={`/notes/${encodeURIComponent(navContext.parent.file_path)}`}
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            ← Back to {navContext.parent.title}
          </Link>
        </div>
      )}

      {/* Note Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-t-2xl p-8 shadow-lg border-b border-purple-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              {note.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                📁 {note.category}
              </span>
              {note.book && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  📖 {note.book}
                </span>
              )}
              {navContext && (
                <>
                  {navContext.is_in_tree && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      🌳 Depth: {navContext.depth}
                    </span>
                  )}
                  {navContext.is_leaf && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      🍃 Leaf Note
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Sibling Navigation */}
          {!isLoadingNav && navContext && navContext.siblings.length > 0 && (
            <div className="ml-4 flex gap-2">
              <span className="text-sm text-gray-600">
                {navContext.siblings.length} sibling{navContext.siblings.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/chat?context=${encodeURIComponent(note.file_path)}`}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow duration-200"
          >
            💬 Chat about this note
          </Link>
          {navContext && navContext.parent && (
            <Link
              href={`/notes/${encodeURIComponent(navContext.parent.file_path)}`}
              className="px-4 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200"
            >
              ⬆️ Go to parent
            </Link>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="bg-white/50 backdrop-blur-sm p-8 shadow-lg">
        <MarkdownRenderer content={contentWithLinks} />
      </div>

      {/* Child Notes (if any) */}
      {!isLoadingNav && navContext && navContext.children.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-b-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📚 Sections in this note ({navContext.children.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {navContext.children.map((child, index) => (
              <Link
                key={index}
                href={`/notes/${encodeURIComponent(child.file_path)}`}
                className="block p-4 bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-purple-400"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1 truncate">
                      {child.title}
                    </h3>
                    <p className="text-xs text-purple-600 font-medium">
                      Click to read →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Siblings Navigation (at bottom for easy next/previous) */}
      {!isLoadingNav && navContext && navContext.siblings.length > 0 && (
        <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            🔗 Related Sections ({navContext.siblings.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {navContext.siblings.map((sibling, index) => (
              <Link
                key={index}
                href={`/notes/${encodeURIComponent(sibling.file_path)}`}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors duration-200 text-center"
              >
                {sibling.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

