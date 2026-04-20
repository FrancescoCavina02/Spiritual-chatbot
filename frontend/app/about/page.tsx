import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Spiritual AI Guide',
  description:
    'About the Spiritual AI Guide: a RAG-powered chatbot built with FastAPI, ChromaDB, sentence-transformers, and GPT-4 Turbo as an MSc AI portfolio project.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 via-teal-700 to-amber-600 bg-clip-text text-transparent pb-2">
          Spiritual AI Guide
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          A production-deployed RAG chatbot that semantically searches 1,649 personal Obsidian notes
          and generates spiritually-grounded, cited responses — built as an MSc AI portfolio project
          for the University of Amsterdam.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <a
            href="https://github.com/FrancescoCavina02/Spiritual-chatbot"
            target="_blank"
            rel="noopener noreferrer"
            id="about-github-link"
            className="px-6 py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-700 transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
          <a
            href="/docs"
            id="about-api-docs-link"
            className="px-6 py-3 bg-teal-50 text-teal-700 border-2 border-teal-600 rounded-xl font-semibold hover:bg-teal-100 transition-colors duration-200"
          >
            API Documentation
          </a>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Notes Indexed', value: '1,649', icon: '📚' },
          { label: 'Semantic Chunks', value: '1,772', icon: '🔍' },
          { label: 'Embedding Dims', value: '384D', icon: '🧮' },
          { label: 'LLM Providers', value: '4', icon: '🤖' },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="bg-white/70 backdrop-blur-sm border border-teal-100 rounded-xl p-4 text-center shadow-sm"
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-teal-700">{value}</div>
            <div className="text-xs text-stone-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* What is this project */}
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">What is this project?</h2>
        <p className="text-stone-600 leading-relaxed mb-4">
          Over three years, I accumulated 1,649 Markdown notes in Obsidian while reading 75+ books
          on spirituality, psychology, philosophy, and neuroscience. This project turns that private
          knowledge base into a conversational AI that can answer questions, surface relevant passages,
          and cite its sources — acting as an AI study partner for the material I have studied.
        </p>
        <p className="text-stone-600 leading-relaxed">
          The system implements Retrieval-Augmented Generation (RAG) end-to-end: notes are chunked
          semantically, embedded with <code className="bg-stone-100 px-1 rounded text-sm">all-MiniLM-L6-v2</code> into 384-dimensional vectors
          stored in ChromaDB, retrieved via hybrid BM25 + dense search, and passed as grounded
          context to GPT-4 Turbo for citation-anchored response generation.
        </p>
      </section>

      {/* RAG Pipeline */}
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">RAG Pipeline</h2>
        <div className="space-y-4">
          {[
            {
              step: '1',
              title: 'Ingestion',
              detail: 'Parse 1,649 Obsidian .md files, extract WikiLink graph, preserve metadata (category, book, file path).',
            },
            {
              step: '2',
              title: 'Semantic Chunking',
              detail: 'Split by Markdown headers → paragraph overflow → 800-token chunks with 150-token sliding overlap.',
            },
            {
              step: '3',
              title: 'Dense Embedding',
              detail: 'Encode all 1,772 chunks with all-MiniLM-L6-v2, L2-normalise, store in ChromaDB HNSW index (cosine metric).',
            },
            {
              step: '4',
              title: 'Hybrid Retrieval + Re-ranking',
              detail: 'ANN search (top-10 candidates) → composite re-rank: 70% cosine similarity + 20% keyword overlap + 10% link density.',
            },
            {
              step: '5',
              title: 'Grounded Generation',
              detail: 'Structured prompt injects retrieved chunks with [Source: X] labels. GPT-4 Turbo generates a cited response streamed via SSE.',
            },
          ].map(({ step, title, detail }) => (
            <div key={step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <h3 className="font-bold text-stone-800">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Skills Demonstrated */}
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">AI Skills Demonstrated</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            'End-to-end RAG pipeline from raw corpus to deployed API',
            'Hybrid BM25 + dense vector retrieval with composite re-ranking',
            'Sentence-transformer embeddings (all-MiniLM-L6-v2, 384D, L2-normalised)',
            'ChromaDB HNSW index with cosine similarity ANN search',
            'Multi-LLM provider abstraction (OpenAI, Ollama, Anthropic, Google)',
            'Async streaming generation via FastAPI Server-Sent Events',
            'Prompt engineering for persona + citation-grounded responses',
            'Regex citation extraction and metadata cross-referencing',
            'NLP data pipeline: Obsidian vault → chunking → embedding → indexing',
            'Model evaluation: quality scoring, latency benchmarking, ablation study',
          ].map((skill) => (
            <div key={skill} className="flex items-start gap-2 text-sm text-stone-600">
              <svg className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {skill}
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-md border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Technical Stack</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              category: 'Backend',
              items: [
                'Python 3.11 + FastAPI',
                'ChromaDB (HNSW, cosine)',
                'sentence-transformers',
                'Pydantic v2 validation',
                'Uvicorn async server',
              ],
            },
            {
              category: 'AI / ML',
              items: [
                'OpenAI GPT-4 Turbo',
                'Ollama Llama 3.1 8B',
                'all-MiniLM-L6-v2 (384D)',
                'Anthropic Claude 3+',
                'Google Gemini (optional)',
              ],
            },
            {
              category: 'Frontend & DevOps',
              items: [
                'Next.js 14 + TypeScript',
                'Tailwind CSS',
                'Docker + docker-compose',
                'Vercel (frontend)',
                'Railway (backend)',
              ],
            },
          ].map(({ category, items }) => (
            <div key={category}>
              <h3 className="font-bold text-teal-700 mb-3 text-sm uppercase tracking-wide">{category}</h3>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="text-sm text-stone-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Academic Context */}
      <section className="bg-gradient-to-br from-teal-50 to-amber-50 rounded-2xl p-8 shadow-md border border-teal-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-4">Academic Context</h2>
        <p className="text-stone-600 leading-relaxed mb-4">
          This project was built as part of my MSc Artificial Intelligence application portfolio for
          the University of Amsterdam (2025–2026). It demonstrates practical fluency in the core
          techniques of modern applied NLP — retrieval-augmented generation, dense vector search,
          transformer-based sentence embeddings, and production LLM integration — implemented from
          scratch on a real personal knowledge corpus.
        </p>
        <p className="text-stone-600 leading-relaxed">
          The project reflects end-to-end AI engineering capability: from corpus ingestion and
          preprocessing through embedding and indexing, to evaluated multi-model generation with
          streaming delivery — the full stack of skills required for graduate-level NLP research.
        </p>
        <div className="mt-6 pt-6 border-t border-teal-100 text-sm text-stone-500">
          Built by <strong className="text-stone-700">Francesco Cavina</strong> ·
          MSc AI Portfolio · University of Amsterdam Application ·{' '}
          <a
            href="https://github.com/FrancescoCavina02/Spiritual-chatbot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-800 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
