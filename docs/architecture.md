# Architecture Overview

## System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Next.js 14 + React)                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Chat         │  │ Note         │  │ Search       │        │
│  │ Interface    │  │ Browser      │  │ Interface    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      FastAPI Backend                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Chat         │  │ Note         │  │ Search       │        │
│  │ Endpoint     │  │ Endpoint     │  │ Endpoint     │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                │
│                            │                                    │
│  ┌─────────────────────────▼──────────────────────────┐       │
│  │              RAG Engine                             │       │
│  │  ┌──────────────┐  ┌──────────────┐              │       │
│  │  │ Query        │  │ Context      │              │       │
│  │  │ Processing   │  │ Retrieval    │              │       │
│  │  └──────┬───────┘  └──────┬───────┘              │       │
│  └─────────┼──────────────────┼──────────────────────┘       │
│            │                  │                                │
└────────────┼──────────────────┼────────────────────────────────┘
             │                  │
┌────────────▼──────────┐  ┌───▼──────────────────────────┐
│   LLM Services        │  │   Vector Database            │
│                       │  │   (ChromaDB)                 │
│  ┌────────────────┐  │  │                              │
│  │ Ollama (Local) │  │  │  ┌────────────────────────┐ │
│  │ - Llama 3.1    │  │  │  │ Note Chunks            │ │
│  │ - Mistral      │  │  │  │ + Embeddings           │ │
│  └────────────────┘  │  │  │ + Metadata             │ │
│                       │  │  └────────────────────────┘ │
│  ┌────────────────┐  │  │                              │
│  │ Cloud APIs     │  │  │  Index: 1500+ notes         │
│  │ - OpenAI       │  │  │  ~5000 chunks               │
│  │ - Anthropic    │  │  │  384-dim vectors            │
│  │ - Google       │  │  └──────────────────────────────┘
│  └────────────────┘  │
└───────────────────────┘
```

## Component Breakdown

### 1. Frontend (Next.js 14)

**Technology Choice**: Next.js 14 with App Router
- Server-side rendering for SEO and performance
- React Server Components for efficient data loading
- Client components for interactivity
- TypeScript for type safety

**Key Components**:
- **ChatInterface**: Real-time streaming chat with AI
- **NoteBrowser**: Hierarchical navigation of knowledge base
- **NoteViewer**: Markdown rendering with Obsidian links
- **SearchInterface**: Semantic and keyword search

**State Management**:
- React hooks for local state
- Context API for global state (user preferences, theme)
- Server actions for data mutations

### 2. Backend (FastAPI)

**Technology Choice**: FastAPI
- Async/await for concurrent request handling
- Pydantic for data validation
- Auto-generated OpenAPI documentation
- WebSocket support for streaming

**Core Services**:

#### ObsidianParser
- Parses Markdown files from vault
- Extracts frontmatter metadata
- Handles bidirectional links `[[Note]]`
- Preserves category hierarchy

#### EmbeddingService
- Generates embeddings for text chunks
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Batch processing for efficiency
- Caching for frequently accessed notes

#### RAGEngine
- **Query Processing**: Embed user query
- **Retrieval**: Hybrid search (semantic + keyword)
- **Re-ranking**: Score and sort by relevance
- **Context Assembly**: Prepare context for LLM

#### LLMService
- Unified interface for multiple LLM providers
- Streaming response support
- Token counting and cost tracking
- Retry logic and error handling

### 3. Vector Database (ChromaDB)

**Technology Choice**: ChromaDB
- Local-first, embedded database
- Persistent storage
- Metadata filtering
- Hybrid search (semantic + keyword via BM25)

**Schema**:
```python
{
    "id": "note_chunk_uuid",
    "embedding": [0.123, -0.456, ...],  # 384-dim vector
    "text": "chunk content",
    "metadata": {
        "note_id": "unique_note_id",
        "title": "Note Title",
        "category": "Spiritual",
        "book": "A New Earth",
        "chapter": "Chapter 1",
        "file_path": "Spiritual/A New Earth/...",
        "links": ["[[Related Note]]", ...],
        "chunk_index": 0,
        "total_chunks": 5
    }
}
```

### 4. LLM Integration

**Hybrid Approach**:

#### Local Models (Ollama)
- **Llama 3.1 8B**: Best balance of quality and speed
- **Mistral 7B**: Fast, good for quick responses
- **Deployment**: Local via Ollama server
- **Pros**: Free, private, no latency from API calls
- **Cons**: Requires GPU/RAM, quality varies

#### Cloud APIs
- **OpenAI GPT-4-turbo**: Best overall quality
- **Anthropic Claude 3 Sonnet**: Excellent for empathetic guidance
- **Google Gemini 1.5 Pro**: Long context window (1M tokens)
- **Pros**: Superior quality, no local resources
- **Cons**: Cost per request, API dependency

## Data Flow

### Chat Request Flow

1. **User Input**
   - User types message in chat interface
   - Frontend validates and sends to backend

2. **Query Processing**
   - FastAPI receives request
   - Embed query using sentence-transformers
   - Extract keywords and detect intent

3. **Context Retrieval**
   - Query ChromaDB with embedding
   - Retrieve top-k similar chunks (k=5-10)
   - Filter by category if relevant
   - Include linked notes from retrieved chunks

4. **Re-ranking**
   - Score chunks by:
     - Semantic similarity (cosine distance)
     - Keyword match (BM25)
     - Recency (if applicable)
     - Link relevance
   - Select final context (3-5 chunks)

5. **Prompt Construction**
   ```
   System: You are a compassionate spiritual guide...
   
   Context:
   [Source: A New Earth - Chapter 1]
   {chunk_text}
   
   [Source: Tao Te Ching - Verse 12]
   {chunk_text}
   
   Conversation History:
   User: {previous_question}
   Assistant: {previous_response}
   
   User: {current_question}
   ```

6. **LLM Generation**
   - Send prompt to selected LLM
   - Stream response token-by-token
   - Parse citations in response

7. **Response Streaming**
   - Backend streams via Server-Sent Events (SSE)
   - Frontend displays with typewriter effect
   - Extract and display citations as chips

### Note Browsing Flow

1. **Category List**
   - Backend scans processed notes
   - Group by category folder
   - Count notes per category
   - Return with preview snippets

2. **Note List (Category)**
   - Filter notes by selected category
   - Sort by book/chapter
   - Include metadata for display

3. **Individual Note**
   - Fetch note by ID
   - Parse Markdown to HTML
   - Resolve `[[links]]` to internal routes
   - Find related notes via embeddings

## Design Decisions

### Why RAG over Fine-tuning?

**Advantages**:
- ✅ Easily updatable (add new notes without retraining)
- ✅ Transparent (see which notes influenced response)
- ✅ Cost-effective (no expensive fine-tuning)
- ✅ Flexible retrieval strategies

**Trade-offs**:
- ❌ Context window limitations
- ❌ Retrieval quality critical to performance

### Why ChromaDB?

**Advantages**:
- ✅ Easy local development
- ✅ Persistent storage
- ✅ Metadata filtering
- ✅ Hybrid search built-in

**Migration Path**:
- Production: Can swap to Pinecone/Weaviate with minimal code changes

### Why Hybrid LLM Strategy?

**Academic Value**:
- Compare local vs cloud approaches
- Quantify quality/cost/latency trade-offs
- Demonstrate understanding of trade-offs

**Practical Value**:
- Start with free local models
- Scale to paid APIs as needed
- A/B test different models

## Scalability Considerations

### Current Architecture (MVP)
- Single backend instance
- Local ChromaDB
- Supports ~10-50 concurrent users

### Future Scaling

**Backend**:
- Horizontal scaling with load balancer
- Separate RAG service from API layer
- Caching layer (Redis) for embeddings

**Vector Database**:
- Migrate to Pinecone/Weaviate
- Serverless, managed infrastructure
- Better performance at scale

**LLM**:
- Queue system for heavy loads
- Model serving infrastructure (vLLM)
- Response caching for common queries

## Security Considerations

1. **API Security**
   - Rate limiting per IP/user
   - API key authentication for admin endpoints
   - Input sanitization

2. **Data Privacy**
   - No user data stored (initially)
   - Conversation history optional
   - Local LLM option for privacy

3. **Cost Control**
   - Token limits per request
   - Daily API cost caps
   - Fallback to local models

## Performance Optimization

1. **Embedding Caching**
   - Cache query embeddings (short TTL)
   - Pre-compute note embeddings

2. **Response Streaming**
   - Token-by-token streaming
   - Reduces perceived latency

3. **Lazy Loading**
   - Load note content on demand
   - Pagination for large lists

4. **Code Splitting**
   - Dynamic imports in Next.js
   - Smaller initial bundle size

## Monitoring & Observability

**Metrics to Track**:
- Request latency (p50, p95, p99)
- Retrieval quality (relevance scores)
- LLM response time
- Cost per request
- Error rates

**Tools**:
- FastAPI built-in logging
- Custom metrics for RAG pipeline
- Error tracking (Sentry - optional)

---

*This architecture is designed to be academic-friendly: well-documented, modular, and demonstrating understanding of trade-offs.*

