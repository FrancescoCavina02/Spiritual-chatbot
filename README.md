<div align="center">

# Spiritual AI Guide

### RAG-Powered Knowledge Chatbot

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20DB-FF6B35?style=flat-square)](https://trychroma.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4%20Turbo-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**[Live Demo](https://spiritualchatbot1.netlify.app/) · [API Docs](https://spiritualchatbot1.netlify.app/docs) · [Architecture](docs/architecture.md) · [RAG Pipeline](docs/rag-pipeline.md) · [Portfolio](https://francesco-cavina.netlify.app/)**

</div>

---

## Abstract

Spiritual AI Guide is a production-deployed, full-stack Retrieval-Augmented Generation (RAG) system that semantically searches a personal knowledge base of 1,649 Obsidian notes (~300,000 words, spanning 75+ books on spirituality, psychology, philosophy, and neuroscience) and generates precise, cited responses via large language models. The system implements a five-stage RAG pipeline — vault ingestion, structure-aware semantic chunking, 384-dimensional sentence-transformer embedding into ChromaDB, hybrid BM25 + dense vector retrieval with composite re-ranking, and multi-LLM generation (GPT-4 Turbo primary, Ollama Llama 3.1 local) — demonstrating end-to-end applied NLP engineering from raw Markdown corpus to a streaming, citation-grounded chat interface. The architecture is containerised with Docker and deployed on Vercel (frontend) and Railway (backend), providing a publicly accessible demonstration of retrieval-augmented AI at scale.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│              Next.js 14  ·  TypeScript  ·  Tailwind CSS         │
│        Chat · Semantic Search · Note Browser · Tree View        │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST / SSE  (NEXT_PUBLIC_API_URL)
┌──────────────────────────▼──────────────────────────────────────┐
│                      FASTAPI BACKEND                            │
│  /api/chat  ·  /api/search  ·  /api/notes  ·  /api/tree        │
│                   RAG Engine (Orchestrator)                     │
└───┬────────────────┬───────────────────┬────────────────────────┘
    │                │                   │
    ▼                ▼                   ▼
┌───────────┐  ┌──────────────┐  ┌─────────────────────────────┐
│ ChromaDB  │  │  Embedding   │  │       LLM Providers         │
│ Vector DB │  │  Service     │  │  OpenAI GPT-4 Turbo (prod)  │
│ 1,772 ch. │  │ all-MiniLM   │  │  Ollama Llama 3.1 (local)  │
│ cosine sim│  │ L6-v2 (384D) │  │  Anthropic / Google (opt.)  │
└───────────┘  └──────────────┘  └─────────────────────────────┘

Data Pipeline (offline, run once):
Obsidian Vault (.md) → Parser → Chunker → EmbeddingService → ChromaDB
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend API** | Python 3.11, FastAPI, Uvicorn | Async REST API with SSE streaming |
| **Vector Database** | ChromaDB (persistent) | Embedding storage & ANN retrieval (cosine) |
| **Embedding Model** | `all-MiniLM-L6-v2` (sentence-transformers) | 384D semantic embeddings |
| **Primary LLM** | OpenAI GPT-4 Turbo | Response generation + citation injection |
| **Local LLM** | Ollama Llama 3.1 8B | Free, offline fallback |
| **Optional LLMs** | Anthropic Claude 3, Google Gemini | Multi-provider abstraction |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS | React SSR with streaming chat UI |
| **Data Source** | Obsidian Markdown vault (1,649 notes) | Personal curated knowledge base |
| **Containerisation** | Docker, docker-compose | Reproducible local deployment |
| **Deployment** | Vercel (frontend), Railway (backend) | Production cloud hosting |

---

## RAG Pipeline: 5-Stage Architecture

Full technical deep-dive: [docs/rag-pipeline.md](docs/rag-pipeline.md)

### Stage 1 — Obsidian Vault Ingestion
The `ObsidianParser` walks the vault directory tree, extracts Markdown content, and preserves bidirectional `[[WikiLink]]` relationships between notes. Each note is tagged with category, book/source, and file path metadata — critical for citation accuracy.

### Stage 2 — Structure-Aware Semantic Chunking
`ChunkingService` splits notes hierarchically: first by Markdown headers (`#`, `##`, `###`), then by double-newline paragraph boundaries if sections exceed the target size. Parameters: **800-token target chunks, 150-token overlap** (implemented as word-count proxies). The overlap strategy (appending the final N words of the preceding chunk) preserves cross-boundary semantic continuity. Notes shorter than the minimum threshold (100 tokens) are kept as a single chunk.

### Stage 3 — Dense Vector Embedding
All 1,772 chunks are encoded with `sentence-transformers/all-MiniLM-L6-v2`, producing normalised **384-dimensional L2-normalised embeddings** stored in a ChromaDB persistent collection (`hnsw:space=cosine`). Batch encoding (batch_size=32) is used for efficiency. The same model encodes queries at inference time for consistent semantic space alignment.

### Stage 4 — Hybrid Retrieval with Composite Re-ranking
Query processing uses a **composite scoring strategy** combining three signals:
- **Semantic similarity (70%)**: ChromaDB cosine distance → similarity score from the HNSW index (top-10 candidates retrieved)
- **Keyword overlap (20%)**: Jaccard overlap between query tokens and chunk tokens (BM25-style lexical signal without full BM25 index)
- **Link density (10%)**: Notes with more `[[WikiLink]]` connections are treated as more semantically central and receive a bonus (capped at 10%)

The top candidates are re-sorted by this composite score before context assembly.

### Stage 5 — Citation-Grounded LLM Generation
A structured prompt injects retrieved chunks with `[Source: Title]` attribution labels. The system prompt instructs the LLM to maintain these citations in its response. After generation, a regex parser (`\[Source:\s*([^\]]+)\]`) extracts cited titles for display in the citation panel. Both streaming (SSE) and non-streaming endpoints are supported.

---

## Model Comparison

| Model | Provider | Cost | Avg Latency | Response Quality | Privacy |
|-------|----------|------|-------------|-----------------|---------|
| **GPT-4 Turbo** | OpenAI API | ~$0.01–0.03/query | ~12–18s | Excellent | Cloud |
| **Claude 3 Sonnet** | Anthropic API | ~$0.015/query | ~8–12s | Excellent | Cloud |
| **Gemini Pro** | Google API | ~$0.001/query | ~5–8s | Very Good | Cloud |
| **Llama 3.1 8B** | Ollama (local) | Free | ~4–8s\* | Good | On-device |

\* On Apple M2 MacBook Air 8GB RAM. GPT-4 Turbo is ~22× slower than Llama 3.1 locally due to API network overhead, but produces substantially higher quality citations and reasoning.

Full evaluation methodology: [docs/evaluation.md](docs/evaluation.md)

---

## AI Concepts and Skills Involved

- **Retrieval-Augmented Generation (RAG)**: Full end-to-end pipeline from raw corpus to cited LLM responses
- **Semantic chunking**: Structure-aware text segmentation preserving Markdown header hierarchy and paragraph boundaries with configurable overlap
- **Dense vector retrieval**: ANN search via ChromaDB HNSW index with cosine similarity on L2-normalised sentence-transformer embeddings (384D)
- **Hybrid retrieval**: Composite re-ranking combining dense similarity (70%) + BM25-style keyword overlap (20%) + graph centrality heuristic (10%)
- **Multi-LLM provider abstraction**: Abstract base class pattern with interchangeable OpenAI, Anthropic, Google, and Ollama backends
- **Async streaming generation**: FastAPI SSE streaming with `AsyncGenerator` for token-by-token response delivery
- **Prompt engineering**: Structured system prompt with context injection, source attribution format, and persona constraints for a spiritual guidance persona
- **Citation extraction**: Regex-based post-processing to parse and surface inline `[Source: Title]` citations from LLM output
- **Vector database management**: ChromaDB schema design with category/book/path metadata for filtered retrieval
- **NLP data pipeline**: Obsidian `[[WikiLink]]` graph preservation, Unicode-safe Markdown parsing, batch embedding with progress tracking

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com) (optional, for local LLM)
- OpenAI API key (for GPT-4 Turbo)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/FrancescoCavina02/Spiritual-chatbot.git
cd Spiritual-chatbot

# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### Load Your Knowledge Base

```bash
# Set your Obsidian vault path
export OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault

# Run the ingestion pipeline (one-time setup)
python scripts/ingest_notes.py

# Load embeddings into ChromaDB
python scripts/load_chromadb.py
```

### Frontend Setup

```bash
cd frontend
npm install

# Configure API URL
cp env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# Open http://localhost:3000
```

### Docker (Full Stack)

```bash
# Copy and configure environment
cp docker-compose.env.example .env
# Edit .env with your API keys and vault path

docker-compose up --build
```

---

## Deployment

Full deployment guide: [docs/deployment.md](docs/deployment.md)

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Netlify | https://spiritualchatbot1.netlify.app |
| Backend API | Railway | https://spiritual-chatbot-api.onrender.com/api |
| API Docs (Swagger) | Railway | https://spiritual-chatbot-api.onrender.com/docs |

**Architecture:** The Next.js frontend is deployed to Vercel's edge network. The FastAPI backend (with pre-seeded ChromaDB embeddings) runs on Railway with a persistent volume mount for the vector database. Environment variables are configured via each platform's dashboard.

---



## Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers (chat, search, notes, tree)
│   │   ├── models/       # Pydantic request/response schemas
│   │   ├── services/     # Core services (RAG engine, embedding, LLM, ChromaDB)
│   │   └── main.py       # Application entry point & lifespan management
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/              # Next.js 14 App Router pages
│   ├── components/       # Chat, layout, and notes UI components
│   ├── lib/              # API client, storage, markdown utilities
│   └── hooks/            # Custom React hooks (useChat)
├── scripts/
│   ├── ingest_notes.py   # Stage 1–3: Parse → Chunk → Embed
│   └── load_chromadb.py  # Stage 4: Load embeddings into ChromaDB
├── docs/
│   ├── architecture.md   # Full system architecture
│   ├── rag-pipeline.md   # RAG pipeline deep-dive
│   ├── evaluation.md     # Model evaluation & benchmarks
│   └── deployment.md     # Production deployment guide
├── data/
│   ├── raw/              # Source Obsidian notes (gitignored)
│   ├── processed/        # Parsed & chunked JSON (gitignored)
│   └── embeddings/       # ChromaDB persistent store (gitignored)
├── docker-compose.yml
└── railway.toml
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by **[Francesco Cavina](https://francesco-cavina.netlify.app/)** · Powered by RAG + GPT-4 Turbo + ChromaDB  
[GitHub](https://github.com/FrancescoCavina02/Spiritual-chatbot) · [Live Demo](https://spiritualchatbot1.netlify.app) · [Portfolio](https://francesco-cavina.netlify.app/)

</div>
