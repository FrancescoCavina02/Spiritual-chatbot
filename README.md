# Spiritual AI Guide Chatbot

An intelligent chatbot powered by RAG (Retrieval-Augmented Generation) that provides spiritual and psychological guidance based on personal knowledge accumulated from books on spirituality, psychology, self-help, and philosophy.

## 🎯 Project Overview

This project combines cutting-edge NLP technology with a curated collection of spiritual and self-help wisdom to create an AI assistant that can guide people through challenging times. The chatbot references specific passages from books and notes, providing evidence-based spiritual guidance.

### Key Features

- **RAG-Powered Responses**: Uses semantic search to retrieve relevant context from 1500+ personal notes
- **Precise Citations**: Every response includes references to specific notes and book passages
- **Interactive Note Browser**: Explore the entire knowledge base with preserved Obsidian vault structure
- **Hybrid AI Approach**: Compares local LLMs (Llama, Mistral) with cloud APIs (OpenAI, Anthropic, Google)
- **Bidirectional Links**: Obsidian-style `[[note linking]]` preserved and functional
- **Semantic Search**: Find relevant wisdom across all categories

### Categories Covered

- **Spiritual**: A New Earth, Tao Te Ching, The Power of Now, Conversations with God, and more
- **Self-Help**: Atomic Habits, Mastery, Thinking Fast and Slow, Ikigai
- **Science**: Physics, cosmology, neuroscience (Huberman Lab, Why We Sleep)
- **Philosophy**: Metaphysics, existentialism, ethics
- **Psychology**: Cognitive science, mindfulness, meditation

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Python 3.11+
- FastAPI (async web framework)
- ChromaDB (vector database)
- Sentence-Transformers (embeddings)
- Ollama (local LLM hosting)

**Frontend:**
- Next.js 14 (React framework with App Router)
- TypeScript
- Tailwind CSS
- React Markdown

**AI/ML:**
- Local: Llama 3.1, Mistral 7B via Ollama
- Cloud: OpenAI GPT-4, Anthropic Claude 3, Google Gemini
- Embeddings: all-MiniLM-L6-v2 → OpenAI text-embedding-3-small

### System Design

```
User Query → Frontend (Next.js)
    ↓
Backend API (FastAPI)
    ↓
Query Embedding → Vector Search (ChromaDB)
    ↓
Context Retrieval + Ranking
    ↓
LLM (Ollama/OpenAI/Anthropic) + Context
    ↓
Response with Citations → Frontend
```

## 📦 Project Structure

```
spiritual-ai-guide/
├── backend/               # Python FastAPI backend
│   ├── app/
│   │   ├── main.py       # FastAPI application entry
│   │   ├── api/          # REST API endpoints
│   │   ├── models/       # Pydantic data models
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   ├── tests/            # Backend tests
│   └── requirements.txt
├── frontend/             # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js 14 App Router pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and API clients
│   └── package.json
├── data/                 # Data pipeline
│   ├── raw/             # Obsidian vault copy
│   ├── processed/       # Parsed notes (JSON)
│   └── embeddings/      # Vector store persistence
├── scripts/             # Utility scripts
│   ├── ingest_notes.py  # Initial data ingestion
│   └── evaluate_models.py
├── docs/                # Academic documentation
│   ├── architecture.md
│   ├── rag-pipeline.md
│   ├── evaluation.md
│   └── deployment.md
└── docker-compose.yml
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Ollama (for local LLM)
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/spiritual-ai-guide.git
cd spiritual-ai-guide
```

2. **Backend Setup**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup**

```bash
cd frontend
npm install
```

4. **Install Ollama** (for local LLM)

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama3.1:8b
ollama pull mistral:7b
```

5. **Environment Variables**

Create `.env` files in backend and frontend directories:

**backend/.env:**
```env
OPENAI_API_KEY=your_key_here  # Optional, for OpenAI models
ANTHROPIC_API_KEY=your_key_here  # Optional, for Claude
OBSIDIAN_VAULT_PATH=/path/to/obsidian/vault
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running the Application

1. **Ingest Obsidian Notes** (first time only)

```bash
cd scripts
python ingest_notes.py
```

2. **Start Backend**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

3. **Start Frontend**

```bash
cd frontend
npm run dev
```

4. **Access Application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📊 RAG Pipeline

### 1. Data Ingestion
- Parse 1500+ Markdown files from Obsidian vault
- Extract metadata (category, book, chapter, tags)
- Handle bidirectional links `[[Note Title]]`
- Preserve folder hierarchy

### 2. Chunking Strategy
- Semantic chunking based on headers and concepts
- Chunk size: 500-1000 tokens
- Overlap: 100-200 tokens for context continuity

### 3. Embedding Generation
- Model: `all-MiniLM-L6-v2` (384 dimensions)
- Store in ChromaDB with rich metadata

### 4. Retrieval
- Hybrid search: semantic (embeddings) + keyword (BM25)
- Top-k retrieval (k=5-10)
- Re-ranking by relevance score
- Category filtering based on query context

### 5. Generation
- System prompt defines compassionate guide persona
- Retrieved context with source attribution
- Conversation history (4-6 turns)
- Streaming response with citations

## 🧪 Model Comparison

This project implements a hybrid approach to compare different LLM strategies:

| Model | Type | Cost | Latency | Quality | Use Case |
|-------|------|------|---------|---------|----------|
| Llama 3.1 8B | Local | Free | ~200ms | Good | Development, privacy |
| Mistral 7B | Local | Free | ~150ms | Good | Fast iteration |
| GPT-4 Turbo | API | $0.01/1K | ~800ms | Excellent | Production, quality |
| Claude 3 Sonnet | API | $0.003/1K | ~500ms | Excellent | Nuanced guidance |
| Gemini 1.5 Pro | API | $0.00125/1K | ~600ms | Very Good | Long context |

Evaluation metrics and detailed comparison in [`docs/evaluation.md`](docs/evaluation.md).

## 📖 Documentation

- [**Architecture Overview**](docs/architecture.md) - System design and technical decisions
- [**RAG Pipeline Details**](docs/rag-pipeline.md) - Embedding, retrieval, and generation
- [**Model Evaluation**](docs/evaluation.md) - Performance comparison and metrics
- [**Deployment Guide**](docs/deployment.md) - Docker, cloud deployment, scaling

## 🧑‍💻 Development

### Running Tests

**Backend:**
```bash
cd backend
pytest tests/ -v --cov=app
```

**Frontend:**
```bash
cd frontend
npm test
npm run test:e2e
```

### Code Quality

```bash
# Backend
black app/
flake8 app/
mypy app/

# Frontend
npm run lint
npm run type-check
```

## 🚢 Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Cloud Deployment

- **Frontend**: Vercel (automatic deployment from GitHub)
- **Backend**: Railway or Render (with persistent volumes)
- See [`docs/deployment.md`](docs/deployment.md) for detailed instructions

## 🎓 Academic Context

This project was developed as part of an AI Master's program application portfolio at UvA. It demonstrates:

- **Technical Depth**: RAG pipeline, vector databases, API integration
- **ML/AI Knowledge**: Embeddings, semantic search, LLM evaluation
- **Software Engineering**: Clean architecture, testing, documentation
- **Problem Solving**: Obsidian integration, citation tracking
- **Full-Stack Skills**: Modern backend and frontend development

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Book authors and content creators whose wisdom powers this chatbot
- Obsidian for excellent note-taking capabilities
- Open-source AI/ML community for tools and models

## 📧 Contact

Francesco Cavina - francesco.cavina@example.com

Project Link: [https://github.com/yourusername/spiritual-ai-guide](https://github.com/yourusername/spiritual-ai-guide)

---

**Note**: This is an educational and personal project. The AI provides guidance based on personal notes and should not replace professional mental health support.

