'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Category Notes Page (Placeholder)
 * 
 * This page will display all notes in a specific category.
 * Currently a placeholder - full implementation coming soon!
 * 
 * Route: /notes/category/[category]
 * Example: /notes/category/Spiritual
 */
export default function CategoryNotesPage() {
  const params = useParams();
  const category = decodeURIComponent(params.category as string);

  return (
    <div className="max-w-4xl mx-auto text-center space-y-8 py-12">
      <div className="text-6xl">🚧</div>
      <h1 className="text-4xl font-bold text-gray-800">
        {category} Notes
      </h1>
      <p className="text-xl text-gray-600">
        Category note browser coming soon!
      </p>
      <p className="text-gray-600">
        For now, try asking about {category} topics in the chat interface.
      </p>
      <div className="flex gap-4 justify-center pt-4">
        <Link
          href="/chat"
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Go to Chat
        </Link>
        <Link
          href="/notes"
          className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-purple-600"
        >
          Back to Categories
        </Link>
      </div>
    </div>
  );
}

