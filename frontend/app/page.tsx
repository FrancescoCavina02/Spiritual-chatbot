import Link from 'next/link';

/**
 * Home Page
 * 
 * This is a Server Component (no 'use client') because:
 * - It's mostly static content
 * - No interactivity or React hooks needed
 * - Renders faster on the server
 */
export default function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to Your
          <br />
          Spiritual AI Guide
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          An intelligent companion drawing wisdom from 1,649 notes across spirituality, 
          psychology, self-help, and philosophy to guide you through life's challenges.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/chat"
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            Start Chatting 💬
          </Link>
          <Link
            href="/notes"
            className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-purple-600"
          >
            Browse Notes 📚
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 pt-8">
        <FeatureCard
          emoji="🔍"
          title="RAG-Powered"
          description="Retrieves relevant wisdom from your personal knowledge base using semantic search"
        />
        <FeatureCard
          emoji="📖"
          title="Precise Citations"
          description="Every answer includes references to specific notes and book passages"
        />
        <FeatureCard
          emoji="🧘"
          title="Spiritual Wisdom"
          description="Drawing from 75+ books on spirituality, psychology, and self-help"
        />
      </div>

      {/* Categories Preview */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Knowledge Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            '🙏 Spiritual',
            '💡 Self-Help',
            '🧠 Psychology',
            '🔬 Science',
            '📚 Philosophy',
            '🎯 Productivity',
            '❤️ Relationships',
            '🌟 Mindfulness',
          ].map((category) => (
            <div
              key={category}
              className="px-4 py-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg text-center font-medium text-gray-700 hover:scale-105 transition-transform duration-200"
            >
              {category}
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-gray-800">Powered By</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {['Next.js 14', 'FastAPI', 'OpenAI GPT-4', 'ChromaDB', 'RAG Pipeline'].map(
            (tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 shadow-md"
              >
                {tech}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Card Component
 * 
 * A reusable component for displaying features.
 * This demonstrates component composition in React!
 */
function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
