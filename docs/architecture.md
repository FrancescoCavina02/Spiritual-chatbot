# System Architecture

> Technical reference for the Spiritual AI Guide RAG chatbot — a portfolio project by Francesco Cavina demonstrating full-stack applied NLP engineering.

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow: Request Lifecycle](#data-flow-request-lifecycle)
4. [Backend Services](#backend-services)
5. [ChromaDB Schema](#chromadb-schema)
6. [API Contracts](#api-contracts)
7. [Frontend Architecture](#frontend-architecture)
8. [Deployment Architecture](#deployment-architecture)

---

## High-Level Overview

The system follows a client-server architecture with three logical tiers:

1. **Frontend** (Next.js 14) — React-based UI with streaming chat interface, semantic search, and note browser
2. **Backend API** (FastAPI) — orchestrates the RAG pipeline, manages service singletons, and exposes REST endpoints with SSE streaming support
3. **Data Layer** — ChromaDB for vector storage + retrieval, sentence-transformer model for embedding, and multi-provider LLM abstraction

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER BROWSER / CLIENT                           │
│                                                                     │
│   ┌──────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │
│   │  Chat Page   │  │  Search Page    │  │   Notes Browser     │   │
│   │  (SSE stream)│  │  (semantic)     │  │   + Tree View       │   │
│   └──────┬───────┘  └────────┬────────┘  └──────────┬──────────┘   │
└──────────┼──────────────────┼──────────────────────┼──────────────┘
           │    HTTPS / REST   │                      │
           │    + SSE stream   │                      │
┌──────────▼──────────────────▼──────────────────────▼──────────────┐
│                      FASTAPI BACKEND                               │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │                    RAG Engine                            │    │
│   │  embed_query() → vector_db.query() → rerank() →        │    │
│   │  assemble_context() → construct_prompt() →              │    │
│   │  llm_service.generate()                                 │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│   ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│   │  VectorDB   │  │ EmbeddingService │  │   LLMService     │    │
│   │  (ChromaDB) │  │  all-MiniLM-L6v2 │  │  Multi-provider  │    │
│   │  1,772 chks │  │  384D embeddings │  │  abstraction     │    │
│   └─────────────┘  └──────────────────┘  └──────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
           │                       │                  │
           ▼                       ▼                  ▼
    ┌─────────────┐       ┌──────────────┐   ┌──────────────────┐
    │  ChromaDB   │       │ HuggingFace  │   │  OpenAI API /    │
    │  Persistent │       │ Model Hub    │   │  Ollama / Claude │
    │  SQLite3    │       │  (cached)    │   │  / Gemini        │
    └─────────────┘       └──────────────┘   └──────────────────┘
```

---

## Component Architecture

### Backend Components

```
backend/
├── app/
│   ├── main.py                  # FastAPI application, lifespan, CORS, routes
│   ├── api/
│   │   ├── chat.py              # POST /api/chat, POST /api/chat/stream
│   │   ├── search.py            # POST /api/search (semantic search)
│   │   ├── notes.py             # GET /api/notes, GET /api/notes/{id}
│   │   └── tree.py              # GET /api/tree/* (knowledge graph navigation)
│   ├── models/
│   │   ├── api.py               # Pydantic request/response schemas
│   │   └── note.py              # Note and Chunk domain models
│   ├── services/
│   │   ├── rag_engine.py        # RAG orchestrator (retrieve + generate)
│   │   ├── embedding_service.py # Sentence-transformer wrapper + singleton
│   │   ├── vector_db.py         # ChromaDB wrapper + singleton
│   │   ├── llm_service.py       # Multi-LLM provider abstraction
│   │   ├── chunking_service.py  # Semantic text chunking
│   │   ├── obsidian_parser.py   # Obsidian vault Markdown parser
│   │   └── tree_parser.py       # WikiLink graph / tree builder
│   └── utils/
│       └── __init__.py
├── Dockerfile                   # Production container (multi-stage)
└── requirements.txt
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API framework | FastAPI | Native async, Pydantic validation, auto-generated OpenAPI docs |
| Service pattern | Module-level singletons | Avoid re-loading 300MB model on every request |
| Streaming | FastAPI SSE with `AsyncGenerator` | Token-by-token delivery for UX responsiveness during 12–18s GPT-4 calls |
| Vector DB | ChromaDB persistent | Simple Python-native setup; no external DB server required for development |
| Embedding model | `all-MiniLM-L6-v2` | 384D vs 768D: 2× faster inference, minimal quality regression for short-text RAG |
| LLM abstraction | Abstract base class | Drop-in swap between OpenAI, Anthropic, Google, Ollama without changing caller code |

---

## Data Flow: Request Lifecycle

### Chat Request (Non-streaming)

```
Client                     FastAPI                  RAGEngine            ChromaDB         LLM
  │                           │                         │                    │              │
  │  POST /api/chat           │                         │                    │              │
  │  {message, provider}      │                         │                    │              │
  │──────────────────────────►│                         │                    │              │
  │                           │  retrieve_context(q)    │                    │              │
  │                           │────────────────────────►│                    │              │
  │                           │                         │  embed_text(q)     │              │
  │                           │                         │  [384D vector]     │              │
  │                           │                         │  query(embedding,  │              │
  │                           │                         │  n_results=10)     │              │
  │                           │                         │───────────────────►│              │
  │                           │                         │  results (docs,    │              │
  │                           │                         │  metadata, dists)  │              │
  │                           │                         │◄───────────────────│              │
  │                           │                         │  rerank(query,     │              │
  │                           │                         │  results)          │              │
  │                           │                         │  [composite score] │              │
  │                           │                         │  assemble_context()│              │
  │                           │  context, citations     │                    │              │
  │                           │◄────────────────────────│                    │              │
  │                           │                         │                    │              │
  │                           │  construct_prompt()     │                    │              │
  │                           │  llm.generate(prompt)   │                    │              │
  │                           │─────────────────────────────────────────────────────────►  │
  │                           │  response_text          │                    │              │
  │                           │◄─────────────────────────────────────────────────────────  │
  │  ChatResponse             │                         │                    │              │
  │  {message, citations,     │                         │                    │              │
  │   model_used, time_ms}    │                         │                    │              │
  │◄──────────────────────────│                         │                    │              │
```

### Streaming Chat Request

The `/api/chat/stream` endpoint follows the same pipeline but wraps the LLM call in `llm_service.generate_stream()`, which yields token chunks as Server-Sent Events:

```
data: {"type": "citations", "data": [...]}    # sent first, before generation
data: {"type": "text", "data": "The "}        # one event per token/chunk
data: {"type": "text", "data": "practice "}
...
data: {"type": "done", "model": "openai"}     # signals stream completion
```

---

## Backend Services

### RAGEngine

The `RAGEngine` class (in `services/rag_engine.py`) is the central orchestrator. It holds references to `VectorDBService` and `EmbeddingService` as constructor-injected dependencies and exposes three methods:

- `retrieve_context(query, category_filter, book_filter)` → `(str, List[Citation])`
- `construct_prompt(query, context, conversation_history)` → `str`
- `parse_citations(response)` → `List[str]`

**Re-ranking composite score** (implemented in `_rerank_results`):

```
final_score = (cosine_similarity × 0.70)
            + (keyword_jaccard_overlap × 0.20)
            + (min(link_count × 0.01, 0.10))
```

### EmbeddingService

Singleton wrapper around `sentence_transformers.SentenceTransformer`. Loads the model once at startup, exposes:
- `embed_text(text: str) → List[float]` — single query/doc embedding, L2-normalised
- `embed_chunks(chunks, show_progress) → List[Chunk]` — batch embed with progress bar
- `embed_batch(texts, normalize) → np.ndarray` — raw batch encoding

Normalisation ensures embeddings are unit vectors, making dot product equivalent to cosine similarity in ChromaDB.

### VectorDBService

Persistent ChromaDB client with collection metadata `{"hnsw:space": "cosine"}`. Key operations:
- `add_chunks(chunks, batch_size=100)` — batch upsert with metadata
- `query(embedding, n_results, category_filter, book_filter)` — ANN query with optional `where` clause filtering
- `get_statistics()` — full collection scan for category/book distribution

### LLMService

Abstract provider pattern:

```python
class BaseLLMProvider(ABC):
    async def generate(prompt, **kwargs) -> str
    async def generate_stream(prompt, **kwargs) -> AsyncGenerator[str, None]
```

Concrete implementations: `OpenAIProvider`, `OllamaProvider`, `AnthropicProvider`. `LLMService` instantiates all configured providers at startup, selects based on request parameter, and falls back to the first available provider if the requested one is unavailable.

---

## ChromaDB Schema

**Collection name:** `spiritual_notes`  
**Distance metric:** Cosine similarity  
**Embedding dimension:** 384 (all-MiniLM-L6-v2)

Each document in the collection corresponds to one text chunk:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | `{note_id}_chunk_{index}` — globally unique chunk identifier |
| `embedding` | `float[384]` | L2-normalised sentence embedding |
| `document` | string | Raw chunk text (used for keyword matching & display) |
| `metadata.note_id` | string | Parent note identifier |
| `metadata.title` | string | Note title (used for citations) |
| `metadata.category` | string | Top-level category (e.g., `Spiritual`, `Psychology`) |
| `metadata.book` | string | Source book/collection name (nullable) |
| `metadata.file_path` | string | Relative path in vault (e.g., `Spiritual/Eckhart Tolle/power_of_now.md`) |
| `metadata.chunk_index` | int | Position of chunk within parent note |
| `metadata.total_chunks` | int | Total chunk count for parent note |
| `metadata.links` | string | `str(List[str])` — WikiLink targets from parent note |

**Notes on metadata encoding:** ChromaDB metadata values must be scalar types. The `links` field (a list of wiki-link targets) is serialised as `str(list)` and deserialised with `ast.literal_eval()` at query time — a safe alternative to `eval()`.

---

## API Contracts

### POST `/api/chat`

**Request:**
```json
{
  "message": "How can I practice mindfulness in daily life?",
  "provider": "openai",
  "category_filter": "Spiritual",
  "stream": false,
  "conversation_id": "conv_abc123"
}
```

**Response:**
```json
{
  "message": "Mindfulness in daily life can be practiced through...",
  "conversation_id": "conv_abc123",
  "citations": [
    {
      "title": "Present Moment Awareness",
      "category": "Spiritual",
      "book": "The Power of Now",
      "file_path": "Spiritual/Eckhart Tolle/present_moment.md",
      "snippet": "The present moment is all we have...",
      "relevance_score": 0.891
    }
  ],
  "model_used": "openai",
  "processing_time_ms": 14325.7
}
```

### POST `/api/search`

**Request:**
```json
{
  "query": "ego dissolution and consciousness",
  "n_results": 10,
  "category_filter": "Spiritual"
}
```

**Response:**
```json
{
  "query": "ego dissolution and consciousness",
  "results": [
    {
      "chunk_id": "spiritual_eckhart_001_chunk_0",
      "title": "The Ego Mind",
      "category": "Spiritual",
      "book": "A New Earth",
      "file_path": "Spiritual/Eckhart Tolle/ego_mind.md",
      "text": "The ego is a misidentification with thought...",
      "relevance_score": 0.847
    }
  ],
  "total_results": 10,
  "processing_time_ms": 42.3
}
```

### GET `/health`

```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T14:30:00Z",
  "version": "1.0.0",
  "services": {
    "api": "operational",
    "chromadb": "operational (1,772 chunks indexed)",
    "embeddings": "operational (sentence-transformers/all-MiniLM-L6-v2, 384D)",
    "llm": "2 provider(s) active: openai, ollama",
    "uptime_seconds": 3600
  }
}
```

---

## Frontend Architecture

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx          # Root layout (Navigation + body styles)
│   ├── page.tsx            # Home page (hero, features, tech stack)
│   ├── chat/page.tsx       # Chat interface with SSE streaming
│   ├── search/page.tsx     # Semantic search results page
│   ├── notes/page.tsx      # Note browser with category filter
│   └── about/page.tsx      # Project overview modal/page
├── components/
│   ├── chat/
│   │   ├── MessageBubble.tsx      # User/AI message rendering with citations
│   │   ├── MessageInput.tsx       # Textarea with send button + loading state
│   │   ├── MessageList.tsx        # Scrollable message history + streaming display
│   │   ├── CitationChip.tsx       # Inline source badge
│   │   ├── CitationPanel.tsx      # Sidebar citation detail panel
│   │   └── ConversationSidebar.tsx # Conversation history (localStorage-backed)
│   └── layout/
│       └── Navigation.tsx  # Sticky nav with active route highlighting
├── lib/
│   ├── api.ts              # Type-safe API client for all backend endpoints
│   ├── storage.ts          # localStorage conversation persistence
│   ├── markdown-utils.ts   # Markdown rendering helpers
│   └── wikilinks.ts        # Obsidian WikiLink parsing
└── hooks/
    └── useChat.ts          # Custom hook: message state, streaming, SSE parsing
```

**State management:** All chat state (messages, conversation ID, citations, streaming content) is managed in the `useChat` custom hook using `useState`. Conversation history is persisted to `localStorage` via `storage.ts`. No global state library is used — the scope is intentionally minimal.

**Streaming pattern:** The `useChat` hook calls `chatWithStreaming()` from `api.ts`, which returns a `ReadableStream`. The `parseSSEStream()` async generator processes the stream incrementally, dispatching `token` events to build the streaming message in real time and `citations` events to populate the citation panel before generation completes.

---

## Deployment Architecture

See [docs/deployment.md](deployment.md) for full step-by-step instructions.

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Next.js native; automatic CI/CD from GitHub |
| Backend | Railway | Dockerfile-based; `$PORT` env var handled automatically |
| ChromaDB | Railway volume | Pre-seeded database committed to repo (gitignored in production) or mounted volume |
| LLM | OpenAI API | Key set via Railway environment variables |

**Environment variables required at runtime:**

| Variable | Service | Required |
|----------|---------|----------|
| `OPENAI_API_KEY` | Railway | Yes (for GPT-4) |
| `NEXT_PUBLIC_API_URL` | Vercel | Yes (points to Railway URL) |
| `CORS_ORIGINS` | Railway | Recommended (production frontend URL) |
| `ANTHROPIC_API_KEY` | Railway | Optional |
| `GOOGLE_API_KEY` | Railway | Optional |
