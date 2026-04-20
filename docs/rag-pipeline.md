# RAG Pipeline Deep-Dive

> Technical documentation of the five-stage Retrieval-Augmented Generation pipeline powering the Spiritual AI Guide chatbot.

---

## Overview

The RAG pipeline converts a natural language query into a grounded, cited response by dynamically retrieving the most semantically relevant passages from a private knowledge base. This allows the LLM to operate as a reasoning engine over domain-specific content rather than relying solely on parametric knowledge, and to provide verifiable source citations for every claim.

```
User Query
    │
    ▼
[1] EMBED QUERY          (all-MiniLM-L6-v2 → 384D L2-normalised vector)
    │
    ▼
[2] RETRIEVE             (ChromaDB ANN search, top-10 candidates)
    │
    ▼
[3] RE-RANK              (semantic 70% + keyword 20% + link density 10%)
    │
    ▼
[4] ASSEMBLE CONTEXT     (select top chunks up to token budget, format with [Source: X])
    │
    ▼
[5] GENERATE + CITE      (LLM with structured prompt → cited text response)
    │
    ▼
Streamed Response + Citations Panel
```

---

## Stage 1: Obsidian Vault Ingestion

**Module:** `backend/app/services/obsidian_parser.py`
**Script:** `scripts/ingest_notes.py`

The ingestion pipeline is a one-time offline process that transforms the raw Obsidian vault into structured data for embedding.

### Vault Structure

The Obsidian vault is organised as a two-level hierarchy:

```
Obsidian Books/
├── Spiritual/
│   ├── Eckhart Tolle/
│   │   ├── The Power of Now/
│   │   │   └── present_moment.md
│   │   └── A New Earth/
│   │       └── ego_mind.md
├── Psychology/
│   └── Huberman Lab/
│       └── dopamine_regulation.md
└── Self-Help/
    └── Atomic Habits/
        └── habit_loops.md
```

### Parsing Process

1. **Directory traversal**: Recursively walk the vault, collecting all `.md` files
2. **Metadata extraction**: Infer `category` (top-level folder), `book` (second-level folder), `title` (filename), and `file_path` (relative path)
3. **Content cleaning**: Strip Obsidian-specific syntax that would degrade embedding quality: YAML frontmatter, embedded image references (`![[image.png]]`), and Obsidian tags (`#tag`)
4. **WikiLink preservation**: Bidirectional `[[WikiLink]]` references are extracted into a `links: List[str]` field on each note, stored in ChromaDB metadata and used in re-ranking
5. **Statistics**: Total notes, total words, unique categories and books are computed and saved

**Corpus size:** 1,649 notes · ~300,000 words · 75+ source books

---

## Stage 2: Structure-Aware Semantic Chunking

**Module:** `backend/app/services/chunking_service.py`

### Why Chunk?

Large language models and embedding models have context length limits. More importantly, smaller, semantically coherent chunks produce better dense retrieval results: a 300-word chunk about one concept retrieves more precisely than a 2,000-word note spanning many topics.

### Chunking Algorithm

The `ChunkingService` implements a hierarchical chunking strategy that respects the semantic structure of Markdown notes:

**Step 1 — Header-based segmentation:** Using regex `r'^#{1,6}\s+.+$'`, the note is split into sections at Markdown headers. This naturally groups content by topic — each `## Sub-section` becomes an atomic semantic unit.

**Step 2 — Paragraph overflow handling:** If a section exceeds the target size, it is further split by double-newline paragraph boundaries (`\n\n+`). Paragraphs are greedily packed into chunks until the word budget is exhausted.

**Step 3 — Sliding window overlap:** Adjacent chunks share a 150-token overlap (implemented as ~115 words using `150 / 1.3` as a word-to-token conversion heuristic). The last N words of chunk `i-1` are prepended to chunk `i` with a ` ... ` separator, ensuring that queries near chunk boundaries retrieve coherent context regardless of the split point.

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `chunk_size` | 800 tokens | Balances retrieval precision vs. context coverage |
| `chunk_overlap` | 150 tokens | ~19% overlap; standard for RAG pipelines |
| `min_chunk_size` | 100 tokens | Filters out headings-only fragments |
| `words_per_chunk` | ~615 words | `800 / 1.3` conversion |

**Output:** 1,772 chunks from 1,649 notes (avg 1.07 chunks/note)

---

## Stage 3: Dense Vector Embedding

**Module:** `backend/app/services/embedding_service.py`

### Model: `sentence-transformers/all-MiniLM-L6-v2`

**Why this model over alternatives?**

| Model | Dimension | Approx BEIR Score | Size | Speed |
|-------|-----------|-------------------|------|-------|
| `all-MiniLM-L6-v2` ✓ | 384 | 41.4 | 80MB | ~14,000 sent/sec |
| `all-mpnet-base-v2` | 768 | 43.9 | 420MB | ~2,800 sent/sec |
| `paraphrase-MiniLM-L3-v2` | 384 | 36.2 | 61MB | ~19,000 sent/sec |
| `text-embedding-ada-002` | 1,536 | 46.9 | API | ~3,000 tokens/sec |

`all-MiniLM-L6-v2` is optimal here because:
- 384D embeddings require half the ChromaDB storage of 768D models
- 5× faster inference than `mpnet-base` with only 2.5% BEIR quality loss
- Trained specifically on sentence-level semantic similarity — ideal for short note chunks
- 100% free and local — no API costs for embedding 1,772 chunks
- 80MB model fits comfortably in Railway's container memory

### Embedding Process

All chunk texts are batch-encoded and L2-normalised:

```python
embeddings = model.encode(texts, batch_size=32, convert_to_numpy=True)
norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
embeddings = embeddings / norms  # unit sphere normalisation
```

L2 normalisation makes dot product computationally equivalent to cosine similarity, maximising retrieval accuracy with ChromaDB's cosine distance metric.

**Batch embedding time** (M2 MacBook Air, 8GB): ~4 minutes for all 1,772 chunks.

---

## Stage 4: Hybrid Retrieval with Composite Re-ranking

**Module:** `backend/app/services/rag_engine.py`

### 4a: ANN Retrieval from ChromaDB

```python
results = self.vector_db.query(
    query_embedding=query_embedding,  # L2-normalised 384D vector
    n_results=10,                     # over-retrieve for re-ranking headroom
    category_filter=category_filter,  # optional metadata filtering
)
```

ChromaDB uses an **HNSW (Hierarchical Navigable Small World)** index for approximate nearest-neighbour search with O(log n) query complexity. For 1,772 vectors, retrieval is essentially instantaneous (~1-5ms).

### 4b: Composite Re-ranking

The top-10 ANN candidates are re-ranked using a composite score combining three signals:

**Signal 1 — Semantic similarity (weight: 0.70)**

```python
score = (1.0 - distance) * 0.70  # cosine similarity from ChromaDB
```

The primary signal: how semantically close is the chunk to the query in the embedding space?

**Signal 2 — Keyword overlap (weight: 0.20)**

```python
query_words = set(query.lower().split())
chunk_words = set(chunk_text.lower().split())
keyword_overlap = len(query_words & chunk_words) / len(query_words)
score += keyword_overlap * 0.20
```

A BM25-inspired lexical signal: chunks that share specific keywords with the query receive a bonus. This compensates for cases where dense embedding fails to capture rare terms, proper nouns (specific book titles, authors), or domain-specific vocabulary not well represented in `all-MiniLM-L6-v2`'s training data.

**Signal 3 — Link density (weight: 0.10)**

```python
link_count = len(ast.literal_eval(chunk.metadata['links']))
score += min(link_count * 0.01, 0.10)  # capped at 0.10
```

Notes with more Obsidian `[[WikiLink]]` connections are more "central" in the knowledge graph — typically synthesis notes or key concept explanations. This heuristic approximates PageRank-style centrality without building the full graph.

**Final composite formula:**

```
final_score = (cosine_similarity × 0.70)
            + (keyword_jaccard_overlap × 0.20)
            + (min(link_count × 0.01, 0.10))
```

**Why hybrid over pure dense?**
Dense retrieval can fail on rare terms, named entities, or queries phrased very differently from corpus language. The keyword bonus provides a safety net for specific queries while dense similarity handles semantic paraphrasing.

### 4c: Context Assembly

Ranked chunks are assembled until the word budget (~1,500 words, derived from a 2,000-token context limit with 0.75 tokens/word conversion) is exhausted. Each chunk is prefixed with a source attribution label:

```
[Source: The Power of Now - Present Moment Awareness]
The present moment is all we have...

---

[Source: A New Earth - The Ego Mind]
The ego is a misidentification with thought...
```

---

## Stage 5: Citation-Grounded Generation

**Modules:** `backend/app/services/rag_engine.py`, `backend/app/services/llm_service.py`

### Prompt Engineering

The full prompt has four structured sections:

```
=== SYSTEM ===
You are a compassionate spiritual guide and mentor. Your knowledge comes from
a curated collection of books and notes on spiritual wisdom, psychology,
neuroscience, self-help, and philosophy.

Guidelines:
1. Be warm, empathetic, and non-judgmental
2. Reference specific sources using the format [Source: Book/Note Title]
3. Provide practical guidance alongside wisdom
4. Keep responses focused and concise (2-3 paragraphs)

=== RELEVANT KNOWLEDGE ===
[Source: The Power of Now - Present Moment Awareness]
The present moment is all we have...

---

=== CONVERSATION HISTORY ===   (optional, last 6 messages)
User: ...
Assistant: ...

=== CURRENT QUESTION ===
User: How can I practice mindfulness in daily life?

Please provide a thoughtful, well-cited response that draws on the relevant
knowledge above. Use [Source: Title] format when referencing sources.
```

### Citation Extraction

After generation, a regex parser extracts the source labels the LLM embedded in its response:

```python
pattern = r'\[Source:\s*([^\]]+)\]'
citations = re.findall(pattern, response_text)
```

These citation titles are cross-referenced against the pre-retrieved `Citation` objects (from Stage 4) to display full metadata (book, file path, relevance score, snippet) in the frontend citation panel.

### Multi-LLM Provider Abstraction

The `LLMService` selects the appropriate backend at request time:

```python
class LLMService:
    async def generate(prompt, provider="openai") -> str:
        llm = self.providers[provider]  # OpenAI / Ollama / Anthropic
        return await llm.generate(prompt)

    async def generate_stream(prompt, provider="openai") -> AsyncGenerator:
        async for chunk in self.providers[provider].generate_stream(prompt):
            yield chunk
```

Each provider implements the `BaseLLMProvider` abstract class, ensuring identical interfaces for non-streaming and streaming generation.

**Provider priority at startup:**
1. Ollama (attempted unconditionally — works if Ollama is running locally)
2. OpenAI (activated if `OPENAI_API_KEY` is present)
3. Anthropic (activated if `ANTHROPIC_API_KEY` is present)

If the requested provider is unavailable, the system automatically falls back to the first available provider and logs a warning.

---

## End-to-End Latency Breakdown

Observed on M2 MacBook Air 8GB, OpenAI GPT-4 Turbo:

| Stage | Time | Notes |
|-------|------|-------|
| Query embedding | ~5ms | Single forward pass, all-MiniLM-L6-v2 |
| ChromaDB ANN search | ~2ms | HNSW index, 1,772 vectors |
| Re-ranking | ~1ms | Pure Python list sort |
| Context assembly | ~1ms | String concatenation |
| GPT-4 Turbo generation | ~12,000–18,000ms | API round-trip + generation |
| **Total** | **~12–18 seconds** | Dominated by LLM API latency |

With Ollama Llama 3.1 8B (local):

| Stage | Time |
|-------|------|
| Query embedding | ~5ms |
| ChromaDB + re-rank | ~4ms |
| Llama 3.1 8B generation | ~4,000–8,000ms |
| **Total** | **~4–8 seconds** |

**Streaming** eliminates the perceived wait for GPT-4 Turbo: the first token typically arrives within 1–2 seconds, and the response renders progressively. This is why the `/api/chat/stream` SSE endpoint is the default in the frontend.

