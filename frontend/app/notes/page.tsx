'use client';

import { useEffect, useState } from 'react';
import { getCategories, getStats, Stats } from '@/lib/api';
import Link from 'next/link';

export default function NotesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="animate-spin text-6xl mb-4 text-teal-600 opacity-50">↻</div>
          <p className="text-stone-600 font-medium tracking-wide animate-pulse">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-red-700 font-semibold mb-2">{error}</p>
          <p className="text-stone-600 text-sm">
            Make sure the backend is deployed and running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-amber-600 bg-clip-text text-transparent pb-2">
          Knowledge Library
        </h1>
        <p className="text-xl text-stone-600">
          Explore {stats?.total_notes?.toLocaleString() || 0} notes across {categories.length} categories
        </p>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-200">
            <StatItem label="Total Notes" value={stats.total_notes?.toLocaleString() || '0'} />
            <StatItem label="Semantic Chunks" value={stats.total_chunks?.toLocaleString() || '0'} />
            <StatItem label="Embedding Model" value="MiniLM-L6-v2" />
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryCard
            key={category}
            category={category}
            noteCount={stats?.categories[category] || 0}
          />
        ))}
      </div>

    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center pt-4 md:pt-0">
      <div className="text-3xl font-bold text-teal-800 tracking-tight">{value}</div>
      <div className="text-sm font-semibold text-stone-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function CategoryCard({ category, noteCount }: { category: string; noteCount: number }) {
  const icon = getCategoryIcon(category);
  const color = getCategoryColor(category);

  return (
    <Link href={`/notes/category/${encodeURIComponent(category)}`}>
      <div
        className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full`}
      >
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-stone-800 mb-1">{category}</h3>
        <p className="text-stone-600 font-medium">
          {noteCount} note{noteCount !== 1 ? 's' : ''}
        </p>
      </div>
    </Link>
  );
}

function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    Spiritual: '🌿',
    'Self-Help': '💡',
    Psychology: '🧠',
    Science: '🔬',
    Philosophy: '📚',
    Mindfulness: '🧘',
    Productivity: '🎯',
    Relationships: '🤝',
    Health: '🏥',
    Creativity: '🎨',
    Business: '💼',
    Other: '📝',
  };
  return icons[category] || '📝';
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    Spiritual: 'from-teal-50 to-teal-100/50',
    'Self-Help': 'from-amber-50 to-amber-100/50',
    Psychology: 'from-stone-50 to-stone-200/50',
    Science: 'from-cyan-50 to-cyan-100/50',
    Philosophy: 'from-orange-50 to-orange-100/50',
    Mindfulness: 'from-emerald-50 to-emerald-100/50',
    Productivity: 'from-blue-50 to-blue-100/50',
    Relationships: 'from-rose-50 to-rose-100/50',
    Health: 'from-green-50 to-green-100/50',
    Creativity: 'from-fuchsia-50 to-fuchsia-100/50',
    Business: 'from-slate-50 to-slate-100/50',
    Other: 'from-gray-50 to-gray-200/50',
  };
  return colors[category] || 'from-stone-50 to-white';
}
