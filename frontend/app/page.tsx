import Link from 'next/link';
import SearchBar from '@/components/notes/SearchBar';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-teal-600 via-teal-700 to-amber-600 bg-clip-text text-transparent leading-tight pb-2">
          Spiritual AI Guide
        </h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
          A RAG-powered AI chatbot that semantically searches 1,649 personal notes on spirituality,
          psychology, and philosophy — delivering grounded, cited responses via GPT-4 Turbo.
        </p>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto pt-4">
          <SearchBar placeholder="Semantic search across 1,649 notes…" />
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/chat"
            id="hero-cta-chat"
            className="px-8 py-3 bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            Start Chatting
          </Link>
          <Link
            href="/about"
            id="hero-cta-about"
            className="px-8 py-3 bg-white text-teal-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 border-teal-600"
          >
            About the Project
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 pt-8">
        <FeatureCard
          icon="🔍"
          title="Hybrid RAG Retrieval"
          description="Combines dense vector search (cosine similarity) with BM25 keyword overlap and knowledge-graph link density for precise multi-signal retrieval."
        />
        <FeatureCard
          icon="📖"
          title="Grounded Citations"
          description="Every response includes inline source references — title, book, and relevance score — drawn from the retrieved knowledge base."
        />
        <FeatureCard
          icon="🤖"
          title="Multi-LLM Support"
          description="Swap between GPT-4 Turbo, Ollama Llama 3.1 (free, local), Anthropic Claude, and Google Gemini with a single parameter."
        />
      </div>

      {/* Knowledge Categories */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Knowledge Base Coverage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🙏', label: 'Spiritual' },
            { icon: '💡', label: 'Self-Help' },
            { icon: '🧠', label: 'Psychology' },
            { icon: '🔬', label: 'Neuroscience' },
            { icon: '📚', label: 'Philosophy' },
            { icon: '🎯', label: 'Productivity' },
            { icon: '☯️', label: 'Eastern Philosophy' },
            { icon: '🌿', label: 'Mindfulness' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="px-4 py-3 bg-teal-50 border border-teal-100 rounded-xl text-center font-medium text-teal-800 hover:scale-105 transition-transform duration-200 text-sm"
            >
              {icon} {label}
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-stone-700">Technical Stack</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            'Python · FastAPI',
            'ChromaDB · HNSW',
            'all-MiniLM-L6-v2 (384D)',
            'OpenAI GPT-4 Turbo',
            'Ollama Llama 3.1',
            'Next.js 14 · TypeScript',
            'Docker · Railway · Vercel',
          ].map((tech) => (
            <span
              key={tech}
              className="px-4 py-2 bg-white border border-stone-200 rounded-full text-sm font-medium text-stone-600 shadow-sm"
            >
              {tech}
            </span>
          ))}
        </div>
        <p className="text-sm text-stone-400 pt-2">
          MSc AI Portfolio Project · University of Amsterdam Application · Francesco Cavina
        </p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-md border border-stone-100 hover:shadow-lg transition-shadow duration-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-stone-800 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
