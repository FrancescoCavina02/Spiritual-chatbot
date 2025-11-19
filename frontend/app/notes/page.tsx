'use client';

import { useEffect, useState } from 'react';
import { getCategories, getStats, Stats } from '@/lib/api';
import Link from 'next/link';

/**
 * Notes Browser Page
 * 
 * Displays all note categories in a grid view.
 * Users can click to explore notes by category.
 * 
 * React Learning:
 * - useEffect for data fetching on component mount
 * - Loading states and error handling
 * - Conditional rendering
 */
export default function NotesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch categories and stats when component mounts
   * 
   * useEffect with empty dependency array [] runs once on mount
   */
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [categoriesData, statsData] = await Promise.all([
          getCategories(),
          getStats(),
        ]);
        setCategories(categoriesData);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load categories. Is the backend running?');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🔄</div>
          <p className="text-gray-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-red-600 font-semibold">{error}</p>
          <p className="text-gray-600 mt-2">
            Make sure the backend is running at http://localhost:8000
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          📚 Knowledge Library
        </h1>
        <p className="text-xl text-gray-600">
          Explore {stats?.total_notes || 0} notes across {categories.length} categories
        </p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-3 gap-4">
            <StatItem label="Total Notes" value={stats.total_notes.toString()} />
            <StatItem label="Semantic Chunks" value={stats.total_chunks.toString()} />
            <StatItem label="Embedding Model" value="MiniLM-L6-v2" />
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category}
            category={category}
            noteCount={stats?.categories[category] || 0}
          />
        ))}
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800 font-semibold">
          🚧 Note viewer coming soon! For now, use the chat interface to explore the knowledge base.
        </p>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function CategoryCard({ category, noteCount }: { category: string; noteCount: number }) {
  const icon = getCategoryIcon(category);
  const color = getCategoryColor(category);

  return (
    <Link href={`/notes/category/${encodeURIComponent(category)}`}>
      <div
        className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer`}
      >
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{category}</h3>
        <p className="text-gray-600">
          {noteCount} note{noteCount !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  );
}

function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    Spiritual: '🙏',
    'Self-Help': '💡',
    Psychology: '🧠',
    Science: '🔬',
    Philosophy: '📚',
    Mindfulness: '🧘',
    Productivity: '🎯',
    Relationships: '❤️',
    Health: '🏥',
    Creativity: '🎨',
    Business: '💼',
    Other: '📝',
  };
  return icons[category] || '📝';
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    Spiritual: 'from-purple-100 to-purple-200',
    'Self-Help': 'from-blue-100 to-blue-200',
    Psychology: 'from-pink-100 to-pink-200',
    Science: 'from-green-100 to-green-200',
    Philosophy: 'from-yellow-100 to-yellow-200',
    Mindfulness: 'from-indigo-100 to-indigo-200',
    Productivity: 'from-orange-100 to-orange-200',
    Relationships: 'from-red-100 to-red-200',
    Health: 'from-teal-100 to-teal-200',
    Creativity: 'from-fuchsia-100 to-fuchsia-200',
    Business: 'from-cyan-100 to-cyan-200',
    Other: 'from-gray-100 to-gray-200',
  };
  return colors[category] || 'from-gray-100 to-gray-200';
}

