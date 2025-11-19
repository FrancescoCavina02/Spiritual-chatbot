# RAG Pipeline Implementation

## Overview

This document details the Retrieval-Augmented Generation (RAG) pipeline that powers the spiritual guidance chatbot. The pipeline retrieves relevant context from the Obsidian knowledge base and generates responses using LLMs.

## Pipeline Stages

### 1. Data Ingestion & Processing

#### 1.1 Obsidian Vault Parsing

**Input**: ~1500 Markdown files from Obsidian vault

**Process**:
```python
def parse_obsidian_note(file_path: Path) -> Note:
    # Read file
    content = file_path.read_text(encoding='utf-8')
    
    # Extract frontmatter (YAML metadata)
    frontmatter, body = split_frontmatter(content)
    
    # Extract metadata from path
    category = extract_category(file_path)
    book = extract_book(file_path)
    
    # Parse bidirectional links
    links = extract_obsidian_links(body)  # [[Note Title]]
    
    # Extract citations and page numbers
    citations = extract_citations(body)
    
    return Note(
        id=generate_id(file_path),
        title=frontmatter.get('title', file_path.stem),
        category=category,
        book=book,
        content=body,
        links=links,
        citations=citations,
        file_path=str(file_path)
    )
```

**Output**: Structured JSON with metadata

**Challenges**:
- Mixed languages (English/Italian)
- Inconsistent frontmatter
- Various link formats
- Nested folder structures

**Solutions**:
- Robust regex for link extraction
- Fallback to filename for missing metadata
- Recursive directory traversal
- Unicode handling

#### 1.2 Text Chunking

**Strategy**: Semantic chunking based on content structure

**Why not fixed-size chunks?**
- ❌ May split concepts mid-sentence
- ❌ Loses context at boundaries
- ❌ Arbitrary splits not aligned with meaning

**Semantic Chunking Algorithm**:
```python
def semantic_chunk(note: Note, max_tokens: int = 800) -> List[Chunk]:
    # Split by headers first (# Header, ## Subheader)
    sections = split_by_headers(note.content)
    
    chunks = []
    for section in sections:
        # If section is small enough, it's a chunk
        if count_tokens(section.text) <= max_tokens:
            chunks.append(create_chunk(section))
        else:
            # Split by paragraphs
            paragraphs = section.text.split('\n\n')
            
            current_chunk = []
            current_tokens = 0
            
            for para in paragraphs:
                para_tokens = count_tokens(para)
                
                if current_tokens + para_tokens > max_tokens:
                    # Save current chunk
                    chunks.append(create_chunk_from_paras(current_chunk))
                    current_chunk = [para]
                    current_tokens = para_tokens
                else:
                    current_chunk.append(para)
                    current_tokens += para_tokens
            
            # Add final chunk
            if current_chunk:
                chunks.append(create_chunk_from_paras(current_chunk))
    
    # Add overlap for context continuity
    chunks = add_overlap(chunks, overlap_tokens=150)
    
    return chunks
```

**Parameters**:
- **Chunk size**: 500-1000 tokens (balance between context and precision)
- **Overlap**: 100-200 tokens (maintains context across chunks)
- **Minimum size**: 100 tokens (avoid tiny fragments)

**Metadata Preservation**:
Each chunk inherits:
- Note title, category, book
- File path
- Links from parent note
- Chunk position (index, total)

### 2. Embedding Generation

#### 2.1 Model Selection

**Initial Model**: `sentence-transformers/all-MiniLM-L6-v2`

**Characteristics**:
- 384 dimensions
- Fast inference (~5ms per chunk on CPU)
- 22M parameters
- Trained on 1B+ sentence pairs
- Good balance of quality and speed

**Why this model?**
- ✅ Open-source and free
- ✅ Works well on CPU
- ✅ Small memory footprint
- ✅ Good semantic understanding
- ✅ Widely used and tested

**Future Upgrade**: OpenAI `text-embedding-3-small`
- 1536 dimensions
- Higher quality
- Better for nuanced spiritual concepts
- Cost: $0.00002 per 1K tokens

#### 2.2 Embedding Pipeline

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

def embed_chunks(chunks: List[Chunk], batch_size: int = 32):
    # Prepare texts
    texts = [chunk.text for chunk in chunks]
    
    # Batch embedding for efficiency
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_numpy=True
    )
    
    # Normalize for cosine similarity
    embeddings = embeddings / np.linalg.norm(
        embeddings, axis=1, keepdims=True
    )
    
    return embeddings
```

**Performance**:
- ~5000 chunks total
- Embedding time: ~2-3 minutes on CPU
- One-time cost (cached)

### 3. Vector Storage (ChromaDB)

#### 3.1 Collection Schema

```python
import chromadb

client = chromadb.PersistentClient(path="./data/embeddings")

collection = client.create_collection(
    name="spiritual_notes",
    metadata={
        "hnsw:space": "cosine",  # Cosine similarity
        "hnsw:M": 16,  # Connectivity
        "hnsw:ef_construction": 200  # Index quality
    }
)
```

#### 3.2 Ingestion

```python
collection.add(
    ids=[chunk.id for chunk in chunks],
    embeddings=[chunk.embedding.tolist() for chunk in chunks],
    documents=[chunk.text for chunk in chunks],
    metadatas=[{
        "note_id": chunk.note_id,
        "title": chunk.title,
        "category": chunk.category,
        "book": chunk.book,
        "file_path": chunk.file_path,
        "links": json.dumps(chunk.links),
        "chunk_index": chunk.index,
        "total_chunks": chunk.total
    } for chunk in chunks]
)
```

### 4. Query Processing

#### 4.1 Query Embedding

```python
def process_query(query: str) -> np.ndarray:
    # Embed query with same model as documents
    embedding = model.encode([query])[0]
    
    # Normalize
    embedding = embedding / np.linalg.norm(embedding)
    
    return embedding
```

#### 4.2 Intent Detection (Optional Enhancement)

```python
def detect_intent(query: str) -> str:
    """
    Classify query to improve retrieval
    """
    keywords = {
        "meditation": ["Spiritual"],
        "anxiety": ["Self-Help", "Spiritual"],
        "productivity": ["Self-Help"],
        "physics": ["Science"],
        "philosophy": ["Philosophy"]
    }
    
    query_lower = query.lower()
    
    for keyword, categories in keywords.items():
        if keyword in query_lower:
            return categories
    
    return None  # Search all categories
```

### 5. Context Retrieval

#### 5.1 Hybrid Search

**Semantic Search** (Primary):
```python
results = collection.query(
    query_embeddings=[query_embedding.tolist()],
    n_results=15,  # Initial retrieval
    include=["documents", "metadatas", "distances"]
)
```

**Keyword Search** (Supplementary):
```python
keyword_results = collection.query(
    query_texts=[query],
    n_results=5,
    where={"category": category} if category else None
)
```

**Combination**:
```python
def hybrid_search(query: str, k: int = 10):
    # Semantic results (weight: 0.7)
    semantic = semantic_search(query, n=15)
    
    # Keyword results (weight: 0.3)
    keyword = keyword_search(query, n=10)
    
    # Combine and re-score
    combined = merge_results(
        semantic, keyword,
        weights=(0.7, 0.3)
    )
    
    # Take top k
    return combined[:k]
```

#### 5.2 Re-ranking

**Scoring Function**:
```python
def rerank_chunks(chunks: List[Chunk], query: str):
    for chunk in chunks:
        score = 0.0
        
        # Semantic similarity (already in chunk.distance)
        score += (1 - chunk.distance) * 0.6
        
        # Keyword match (BM25)
        score += bm25_score(query, chunk.text) * 0.3
        
        # Category relevance
        if chunk.category in detect_intent(query):
            score += 0.1
        
        # Link density (more connected = more important)
        score += min(len(chunk.links) * 0.01, 0.1)
        
        chunk.final_score = score
    
    return sorted(chunks, key=lambda x: x.final_score, reverse=True)
```

#### 5.3 Context Assembly

**Select Final Context**:
```python
def assemble_context(chunks: List[Chunk], max_tokens: int = 2000):
    context_parts = []
    total_tokens = 0
    
    for chunk in chunks:
        chunk_tokens = count_tokens(chunk.text)
        
        if total_tokens + chunk_tokens > max_tokens:
            break
        
        # Format with source citation
        part = f"[Source: {chunk.title}]\n{chunk.text}\n"
        context_parts.append(part)
        total_tokens += chunk_tokens
    
    return "\n---\n".join(context_parts)
```

### 6. Prompt Engineering

#### 6.1 System Prompt

```python
SYSTEM_PROMPT = """You are a compassionate spiritual guide and mentor. You help people navigate difficult times with wisdom drawn from spiritual teachings, psychology, and philosophy.

Your knowledge comes from a curated collection of books and notes on:
- Spiritual wisdom (Eckhart Tolle, Tao Te Ching, Buddhism)
- Psychology and neuroscience (Huberman Lab, cognitive science)
- Self-help and personal development (Atomic Habits, Mastery)
- Philosophy and existentialism

Guidelines:
1. Be warm, empathetic, and non-judgmental
2. Reference specific sources when drawing on knowledge
3. Use citations in format: [Source: Book/Note Title]
4. Provide practical guidance alongside wisdom
5. Acknowledge when topics are outside your knowledge base
6. Encourage self-reflection and personal growth
7. Respect all spiritual and philosophical traditions

Remember: You're a guide, not a therapist. For serious mental health concerns, suggest professional help.
"""
```

#### 6.2 Prompt Template

```python
def construct_prompt(
    query: str,
    context: str,
    history: List[Message]
) -> str:
    # System prompt
    prompt = f"{SYSTEM_PROMPT}\n\n"
    
    # Retrieved context
    prompt += f"## Relevant Knowledge:\n\n{context}\n\n"
    
    # Conversation history (last 3 turns)
    if history:
        prompt += "## Conversation History:\n\n"
        for msg in history[-6:]:  # 3 turns = 6 messages
            role = "User" if msg.role == "user" else "You"
            prompt += f"{role}: {msg.content}\n\n"
    
    # Current query
    prompt += f"## Current Question:\n\nUser: {query}\n\n"
    prompt += "Please provide a thoughtful, well-cited response:"
    
    return prompt
```

### 7. Response Generation

#### 7.1 LLM Call

```python
async def generate_response(
    prompt: str,
    model: str = "llama3.1",
    stream: bool = True
):
    if stream:
        async for token in llm_service.generate_stream(prompt, model):
            yield token
    else:
        response = await llm_service.generate(prompt, model)
        return response
```

#### 7.2 Citation Parsing

```python
def parse_citations(response: str) -> List[Citation]:
    # Extract [Source: ...] citations
    pattern = r'\[Source: ([^\]]+)\]'
    citations = re.findall(pattern, response)
    
    # Link to actual notes
    linked_citations = []
    for citation in citations:
        note = find_note_by_title(citation)
        if note:
            linked_citations.append({
                "text": citation,
                "note_id": note.id,
                "url": f"/notes/{note.id}"
            })
    
    return linked_citations
```

## Performance Metrics

### Retrieval Quality

**Metrics**:
- **Precision@K**: How many of top-K results are relevant?
- **Recall@K**: Did we retrieve all relevant chunks?
- **MRR** (Mean Reciprocal Rank): Position of first relevant result

**Evaluation**:
- Create test dataset of 20-30 questions
- Manually label relevant notes for each question
- Calculate metrics

### Generation Quality

**Human Evaluation Criteria**:
1. **Helpfulness**: Does it address the question?
2. **Accuracy**: Is the information correct?
3. **Citation Quality**: Are sources properly referenced?
4. **Empathy**: Is the tone appropriate?
5. **Coherence**: Is it well-structured?

**Rating Scale**: 1-5 for each criterion

### Latency

**Target Latencies**:
- Query embedding: <50ms
- Vector search: <100ms
- Context assembly: <50ms
- LLM first token: <500ms (local), <1000ms (API)
- Total time to first token: <2000ms

## Optimization Strategies

### 1. Caching

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_note_embedding(note_id: str):
    return embeddings_db.get(note_id)
```

### 2. Batch Processing

Process multiple queries in parallel when possible

### 3. Index Optimization

ChromaDB HNSW parameters:
- `M=16`: Good balance
- `ef_construction=200`: High quality index
- `ef_search=100`: Fast search

### 4. Context Window Management

Dynamically adjust context size based on:
- Query complexity
- Model context limit
- Desired response length

## Future Enhancements

1. **Query Expansion**: Use synonyms and related terms
2. **Temporal Ranking**: Prioritize recent insights
3. **Personalization**: Learn user preferences over time
4. **Multi-modal**: Support images from notes
5. **Conversation Context**: Better use of chat history

---

*This pipeline is designed to be transparent and explainable - critical for academic evaluation.*

