'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getNoteById, Note } from '@/lib/api';
import NoteViewer from '@/components/notes/NoteViewer';
import Link from 'next/link';

/**
 * Individual Note Page
 * 
 * Dynamic route for viewing a specific note.
 * Fetches note data and displays with NoteViewer component.
 * 
 * React Learning:
 * - Dynamic routes with [noteId]
 * - useParams to get URL parameters
 * - Data fetching with loading and error states
 */
export default function NotePage() {
  const params = useParams();
  const noteId = decodeURIComponent(params.noteId as string);
  
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNote() {
      try {
        setIsLoading(true);
        const data = await getNoteById(noteId);
        setNote(data);
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNote();
  }, [noteId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📖</div>
          <p className="text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-red-600 font-semibold">{error || 'Note not found'}</p>
          <Link
            href="/notes"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            ← Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  return <NoteViewer note={note} />;
}

