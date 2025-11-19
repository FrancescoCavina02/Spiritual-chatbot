/**
 * About Page
 * 
 * Academic documentation page for UvA application.
 * Showcases the technical implementation and design decisions.
 * 
 * This is a Server Component (no 'use client') for better SEO.
 */
export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Spiritual AI Guide
        </h1>
        <p className="text-xl text-gray-600">
          A RAG-powered chatbot for spiritual and psychological guidance
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <a
            href="https://github.com/FrancescoCavina02/Spiritual-chatbot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200"
          >
            GitHub Repository 🔗
          </a>
        </div>
      </div>

      {/* Project Overview */}
      <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">🎯 Project Overview</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          This project combines cutting-edge NLP technology with a curated collection of spiritual 
          and self-help wisdom to create an AI assistant that can guide people through challenging times. 
          The chatbot references specific passages from books and notes, providing evidence-based spiritual guidance.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <StatBox label="Notes Indexed" value="1,649" icon="📚" />
          <StatBox label="Semantic Chunks" value="1,772" icon="🔍" />
          <StatBox label="Books Referenced" value="75+" icon="📖" />
          <StatBox label="Response Time" value="~15s" icon="⚡" />
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">🛠️ Tech Stack</h2>
        
        <div className="space-y-6">
          <TechSection
            title="Backend"
            items={[
              'Python 3.13 + FastAPI (async, type-safe)',
              'ChromaDB vector database (1,772 indexed chunks)',
              'Sentence-Transformers (all-MiniLM-L6-v2, 384D)',
              'OpenAI GPT-4 Turbo (primary, 15s response)',
              'Ollama Llama 3.1 (local backup)',
            ]}
          />
          
          <TechSection
            title="Frontend"
            items={[
              'Next.js 14 with App Router',
              'TypeScript for type safety',
              'Tailwind CSS for styling',
              'React Markdown for note rendering',
              'Server-Sent Events for streaming',
            ]}
          />
          
          <TechSection
            title="AI/ML"
            items={[
              'RAG (Retrieval-Augmented Generation) pipeline',
              'Semantic search with cosine similarity',
              'Context-aware prompt engineering',
              'Citation generation and linking',
              'Hybrid LLM strategy (local + cloud)',
            ]}
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">🏗️ Architecture</h2>
        <div className="bg-gray-50 rounded-xl p-6 font-mono text-sm">
          <pre className="whitespace-pre-wrap text-gray-700">
{`User Query → Frontend (Next.js)
    ↓
Backend API (FastAPI)
    ↓
Query Embedding → Vector Search (ChromaDB)
    ↓
Context Retrieval + Re-ranking
    ↓
LLM (OpenAI/Ollama) + Context
    ↓
Streaming Response with Citations → Frontend`}
          </pre>
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">✨ Key Features</h2>
        <div className="grid gap-4">
          <FeatureItem
            icon="🔍"
            title="RAG-Powered Responses"
            description="Semantic search retrieves relevant context from 1,649 personal notes"
          />
          <FeatureItem
            icon="📖"
            title="Precise Citations"
            description="Every response includes references to specific notes with relevance scores"
          />
          <FeatureItem
            icon="⚡"
            title="Streaming Responses"
            description="Real-time token-by-token streaming for responsive interactions"
          />
          <FeatureItem
            icon="🔗"
            title="Bidirectional Links"
            description="Obsidian-style [[wiki links]] preserved and functional"
          />
          <FeatureItem
            icon="🎯"
            title="Context-Aware"
            description="Maintains conversation history for coherent multi-turn dialogues"
          />
          <FeatureItem
            icon="🧘"
            title="Spiritual Theme"
            description="Calming aesthetic designed for mindfulness and reflection"
          />
        </div>
      </section>

      {/* Academic Context */}
      <section className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">🎓 Academic Context</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Developed as part of an AI Master's program application portfolio at the University of Amsterdam (UvA).
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">🎯 Demonstrates:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>RAG pipeline implementation</li>
              <li>Vector database integration</li>
              <li>Full-stack development</li>
              <li>API design and documentation</li>
              <li>LLM evaluation methodology</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">📊 Performance:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>OpenAI: 22x faster than local LLM</li>
              <li>Cost: ~$0.034 per query</li>
              <li>Retrieval: Sub-second semantic search</li>
              <li>Quality: Comprehensive citations</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center text-gray-600 text-sm">
        <p>Built with ❤️ by Francesco Cavina</p>
        <p className="mt-2">
          For academic review • UvA AI Master's Program • 2024
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function TechSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

