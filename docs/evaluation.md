# Model Evaluation

> Evaluation methodology and results for the Spiritual AI Guide RAG chatbot. Comparing GPT-4 Turbo vs Llama 3.1 8B vs Claude 3 Sonnet on response quality, citation accuracy, latency, and cost.

---

## Evaluation Objectives

The evaluation assesses two complementary questions:

1. **Retrieval Quality**: Does the RAG pipeline surface the most relevant chunks for a given query?
2. **Generation Quality**: Does the chosen LLM produce accurate, well-cited, helpful responses grounded in the retrieved context?

---

## Test Environment

| Parameter | Value |
|-----------|-------|
| Hardware | Apple M2 MacBook Air, 8GB unified memory |
| Operating System | macOS 14 Sonoma |
| Backend | FastAPI 0.104, Python 3.11 |
| ChromaDB | v0.4.x, persistent, HNSW cosine |
| Embedding model | `all-MiniLM-L6-v2` (384D) |
| Corpus | 1,649 notes, 1,772 chunks |
| Top-k retrieval | 10 candidates, re-ranked to top 5–8 |
| Test queries | 20 spirituality/psychology/philosophy queries |

---

## Evaluation Criteria

Each LLM response was evaluated on five dimensions:

| Dimension | Scale | Description |
|-----------|-------|-------------|
| **Citation Accuracy** | 0–5 | Are the cited sources real, relevant, and correctly attributed? |
| **Response Relevance** | 0–5 | Does the response actually answer the query? |
| **Contextual Grounding** | 0–5 | Is the response based on retrieved chunks (RAG) vs. parametric knowledge? |
| **Coherence & Tone** | 0–5 | Is the response well-structured, warm, and appropriate in tone? |
| **Response Completeness** | 0–5 | Does it address the full scope of the question? |

---

## Retrieval Quality Assessment

### Composite Reranking Validation

The hybrid re-ranking strategy (0.70 semantic + 0.20 keyword + 0.10 link density) was evaluated by comparing it against pure semantic search (cosine similarity only) on 20 test queries.

**Key findings:**

- **Pure dense retrieval** performs well on paraphrased, abstract queries (e.g., "how do I find inner peace?") but degrades on queries containing specific terms not in the model's vocabulary (e.g., "Huberman dopamine protocol", "Tao non-action Wu Wei").
- **Hybrid re-ranking** consistently surfaces the correct note for proper-noun queries by giving a 20% boost to keyword-matched chunks, compensating for the embedding model's OOV sensitivity.
- **Link density bonus** is most impactful for general/synthesis queries, where more central notes (with 5+ WikiLinks) tend to provide broader, more useful context than leaf notes.

**Observed retrieval accuracy:** ~87% of top-5 retrieved chunks were judged as "highly relevant" (relevance score ≥ 0.7) across the 20-query test set.

---

## LLM Generation Comparison

### Test Results Table

Scores are averages across 20 test queries. Latency measured in local network conditions with M2 MacBook Air.

| Metric | GPT-4 Turbo | Llama 3.1 8B | Claude 3 Sonnet |
|--------|-------------|--------------|-----------------|
| Citation Accuracy | **4.7 / 5** | 3.8 / 5 | 4.5 / 5 |
| Response Relevance | **4.8 / 5** | 3.9 / 5 | 4.7 / 5 |
| Contextual Grounding | **4.6 / 5** | 3.6 / 5 | 4.4 / 5 |
| Coherence & Tone | **4.9 / 5** | 4.1 / 5 | **4.9 / 5** |
| Response Completeness | **4.7 / 5** | 3.7 / 5 | 4.5 / 5 |
| **Overall Score** | **4.74 / 5** | 3.82 / 5 | 4.60 / 5 |
| **Avg Latency** | 14,200ms | 5,800ms | 9,100ms |
| **Latency Ratio** | 2.4× Claude | 1× (baseline) | 1.6× Llama |
| **Cost per Query** | ~$0.02 | Free (local) | ~$0.015 |
| **Privacy** | Cloud API | 100% local | Cloud API |

> **GPT-4 Turbo is ~2.4× slower than Claude 3 Sonnet and ~2.5× slower than Llama 3.1 8B locally, but consistently produces the highest-quality citations and most nuanced responses.**

---

## Detailed Findings by Model

### GPT-4 Turbo

**Strengths:**
- Consistently uses the `[Source: Title]` citation format without deviation
- Produces nuanced, empathetic responses that blend multiple retrieved sources coherently
- Excellent at paraphrasing and synthesising across 5 retrieved chunks into a unified answer
- Rarely hallucinates — stays very close to the retrieved context

**Weaknesses:**
- Highest latency (~12–18 seconds end-to-end for non-streaming calls)
- Most expensive at ~$0.02–0.03/query for GPT-4 Turbo pricing
- Streaming mitigates the perceived wait: first token arrives in ~1s

**Best for:** Production deployment, portfolio demonstration, highest-quality citations

---

### Llama 3.1 8B (Ollama, Local)

**Strengths:**
- Completely free, fully private — no data leaves the machine
- Acceptable quality for factual/instructional queries
- ~5,800ms average latency on M2 8GB RAM (8B parameter model)
- Good citation format adherence on ~80% of responses

**Weaknesses:**
- Inconsistent citation format: sometimes invents source titles not in context
- Weaker synthesis: tends to reproduce chunks more literally rather than crafting a coherent narrative
- Struggles with the spiritual guidance persona — occasional tone mismatches
- 8GB RAM makes concurrent requests difficult (model locks memory)

**Best for:** Free local usage, development testing, privacy-critical deployments

---

### Claude 3 Sonnet (Anthropic)

**Strengths:**
- Response tone is exceptionally well-calibrated for a spiritual guidance persona
- Strong citation accuracy, very close to GPT-4 level
- Lower cost than GPT-4 Turbo at ~$0.015/query
- Faster than GPT-4 Turbo (~9 seconds average)

**Weaknesses:**
- Requires an Anthropic API key (not free)
- Slightly less grounded in retrieved context than GPT-4 — occasionally adds unrequested information

**Best for:** Cost-performance balanced production deployments

---

## Retrieval Failure Analysis

### Case Study: "What does the Tao Te Ching say about non-action?"

**Pure dense retrieval top result:** A note on Buddhist non-attachment (cosine sim: 0.74) — incorrect.

**Hybrid retrieval top result:** A note titled "Wu Wei — Non-Action" from the Tao Te Ching category (composite score: 0.81 = 0.73 cosine + 0.08 keyword "tao non-action" boost) — correct.

**Takeaway:** The keyword overlap signal is critical for proper-noun and specific-term queries where the embedding model's vocabulary fails. This is the primary motivation for the hybrid approach.

---

### Case Study: "How do habits form in the brain?"

**Pure dense retrieval top result:** Atomic Habits — Habit Loop (cosine sim: 0.83) — correct.

**Hybrid retrieval top result:** Same (composite score: 0.86) — correct, but with a secondary Huberman Lab note on dopamine reinforcement added to context.

**Takeaway:** Dense retrieval handles abstract semantic queries well. Hybrid doesn't hurt in this case — it enriches the context with a complementary source.

---

## Embedding Model Ablation

A simplified ablation was conducted by re-embedding a 200-chunk sample with `all-mpnet-base-v2` (768D) and comparing retrieval scores.

| Metric | all-MiniLM-L6-v2 (384D) | all-mpnet-base-v2 (768D) |
|--------|------------------------|--------------------------|
| Retrieval accuracy (top-5) | 87% | 89% |
| Embedding time (1,772 chunks) | ~4 min | ~18 min |
| ChromaDB index size | ~26MB | ~52MB |
| Query embedding latency | ~5ms | ~20ms |

**Conclusion:** The 2% retrieval accuracy improvement from `mpnet-base` does not justify the 4.5× embedding time, 2× memory footprint, and 4× query latency increase. `all-MiniLM-L6-v2` is the correct trade-off for this project's scale and deployment constraints.

---

## Limitations & Future Work

| Limitation | Impact | Potential Improvement |
|------------|--------|-----------------------|
| No cross-encoder re-ranking | ~5-10% precision loss on ambiguous queries | Add `cross-encoder/ms-marco-MiniLM-L-6-v2` as a second-stage ranker |
| Keyword overlap uses whitespace tokenisation | Misses stemming/lemmatisation | Integrate NLTK or spaCy for token normalisation |
| Static chunk size (800 tokens) | Sub-optimal for very short/long notes | Adaptive chunking based on note structure |
| No query expansion | Single-vector retrieval misses synonyms | Implement HyDE (Hypothetical Document Embeddings) |
| Manual evaluation (20 queries) | Limited statistical power | Build evaluation harness with ground truth QA pairs |
| Single hop retrieval | Can't answer multi-hop queries | Implement iterative RAG (ReAct-style) |
