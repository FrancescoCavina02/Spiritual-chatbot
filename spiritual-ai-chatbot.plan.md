# Spiritual AI Guide Chatbot - Development Roadmap

**Last Updated:** November 19, 2024  
**Current Status:** 14/19 tasks complete (74%)  
**Current Phase:** Phase 3 - Frontend Development (COMPLETE! 🎉)  
**Phases 1-2:** ✅ Complete and tested  
**Phase 3:** ✅ All core features working including tree navigation!

---

## Project Architecture Overview

**Tech Stack:**

- **Backend:** Python FastAPI (async, high-performance, excellent documentation)
- **Frontend:** React + Next.js 14 (modern, SEO-friendly, server-side rendering)
- **Vector Database:** ChromaDB (local, free) → Pinecone (production, scalable)
- **LLM Strategy:** ✅ **OpenAI GPT-4 Turbo (PRIMARY - tested, 15s response time)** / Ollama Llama 3.1 (backup, local) / Anthropic Claude / Google Gemini (ready for testing)
- **Embeddings:** sentence-transformers/all-MiniLM-L6-v2 (384D, free, fast)
- **Styling:** Tailwind CSS (modern, responsive, easy to learn)
- **Deployment:** Docker + Vercel (frontend) + Railway/Render (backend)

**Key Features:**

1. RAG-powered chatbot with precise note citations
2. Interactive note browser maintaining Obsidian vault structure
3. Hybrid AI approach (local + cloud APIs for comparison)
4. Markdown rendering with bidirectional links
5. Semantic search across all notes
6. Context-aware conversations with conversation history

---

## Phase 1: Foundation & Data Pipeline ✅ COMPLETE (Week 1-2)

**Status:** All tasks complete and tested

### 1.1 Project Setup & Repository Structure ✅

Create GitHub repository with clear structure for academic review:

```
spiritual-ai-guide/
├── README.md                    # Comprehensive project documentation
├── docs/                        # Academic documentation
│   ├── architecture.md          # System design & decisions
│   ├── rag-pipeline.md         # RAG implementation details
│   ├── evaluation.md           # Model comparison & metrics
│   └── deployment.md           # Infrastructure & scaling
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── api/                # API endpoints
│   │   ├── models/             # Pydantic models
│   │   ├── services/           # Business logic
│   │   │   ├── obsidian_parser.py
│   │   │   ├── embedding_service.py
│   │   │   ├── rag_engine.py
│   │   │   └── llm_service.py
│   │   └── utils/
│   ├── tests/                  # Unit & integration tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js 14 app directory
│   │   ├── components/         # React components
│   │   │   ├── chat/
│   │   │   ├── notes/
│   │   │   └── layout/
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # Utilities & API clients
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── data/
│   ├── raw/                    # Obsidian vault copy
│   ├── processed/              # Parsed & chunked notes
│   └── embeddings/             # Vector store
└── scripts/
    ├── ingest_notes.py         # Initial data ingestion
    ├── evaluate_models.py      # Model comparison script
    └── deploy.sh
```

**Documentation Strategy:**
- README: Project overview, setup instructions, demo GIFs
- Architecture docs: Explain RAG pipeline, embedding strategy, model choices
- Evaluation docs: Compare local vs API models with metrics (latency, quality, cost)
- Include diagrams (architecture, data flow, RAG pipeline)

### 1.2 Obsidian Vault Parser ✅

Build robust markdown parser to extract and structure your notes:

**Key Tasks:**
- ✅ Parse 1,649 markdown files from vault
- ✅ Extract metadata (title, category, book, chapter)
- ✅ Handle bidirectional links [[Note Title]]
- ✅ Extract book citations and page references
- ✅ Preserve folder hierarchy (Spiritual/Self-Help/Science/etc.)
- ✅ Handle mixed languages (English/Italian)
- ✅ Store as structured JSON with relationships

**Technologies:**
- `frontmatter` for YAML metadata
- `markdown-it` or `python-markdown` for parsing
- Regex for Obsidian link extraction
- JSON schema for structured storage

### 1.3 Text Chunking & Embeddings ✅

Implement intelligent chunking strategy for RAG:

**Chunking Strategy:**
- ✅ Semantic chunking: Split by headers, concepts (not arbitrary character limits)
- ✅ Chunk size: 500-1000 tokens (balance context vs precision)
- ✅ Overlap: 100-200 tokens between chunks (maintain context)
- ✅ Metadata preservation: Book title, category, file path, internal links

**Embedding Pipeline:**
- ✅ Using all-MiniLM-L6-v2 (local, fast, free, 384 dimensions)
- ✅ Generated 1,772 chunks from 1,649 notes
- ✅ Store embeddings in ChromaDB with metadata filters
- ✅ **All 13 categories indexed** including General (162 chunks) and YouTube Videos (21 chunks)

### 1.4 Vector Database Setup ✅

**ChromaDB Implementation:**
- ✅ Collection for note chunks with metadata
- ✅ Filters by 13 categories (Spiritual, Self-Help, Science, General, YouTube Videos, etc.)
- ✅ Semantic search with cosine similarity
- ✅ Persist to disk for quick startup
- ✅ 1,772 chunks indexed and searchable across 102 books

---

## Phase 2: Backend API Development ✅ COMPLETE (Week 2-3)

**Status:** All endpoints tested and working

### 2.1 FastAPI Application Structure ✅

**Core Endpoints:**
- ✅ POST /api/chat - Send message, receive AI response with citations
- ✅ GET /api/notes - Retrieve notes with filters (category, search)
- ✅ GET /api/notes/{note_id} - Get specific note content
- ✅ GET /api/search - Semantic search across vault
- ✅ GET /api/stats - Database statistics
- ✅ GET /health - Health check

**Features:**
- ✅ CORS configuration for frontend
- ✅ Request validation with Pydantic models
- ✅ Error handling and logging
- ✅ Streaming responses for chat (Server-Sent Events)

### 2.2 RAG Pipeline Implementation ✅

**Retrieval-Augmented Generation Flow:**

**Query Processing:**
- ✅ Embed user question with same model as notes
- ✅ Extract keywords for semantic search

**Context Retrieval:**
- ✅ Semantic search in ChromaDB (top-k=10 chunks)
- ✅ Re-rank by relevance score
- ✅ Filter by category with metadata
- ✅ Preserve bidirectional linked notes (Obsidian connections)

**Prompt Engineering:**
- ✅ System prompt: Define chatbot persona (compassionate spiritual guide)
- ✅ Include retrieved context with clear source attribution
- ✅ Conversation history support
- ✅ Instructions to cite sources with proper format

**Response Generation:**
- ✅ Stream LLM response token-by-token
- ✅ Parse citations with file paths and relevance scores
- ✅ Return structured response with citations

### 2.3 LLM Integration (Hybrid Approach) ✅

**Phase A - Local Models (Ollama):** ✅ Tested
- ✅ Installed Ollama locally
- ✅ Model: llama3.1:8b
- ✅ Result: Works but slow (~340s per response on M2 MacBook Air)
- ✅ Decision: Use as backup only

**Phase B - Cloud APIs:** ✅ OpenAI Tested
- ✅ **OpenAI GPT-4 Turbo (PRIMARY)** - Tested and working perfectly
  - Response time: ~15 seconds
  - Quality: Excellent
  - Cost: ~$0.034 per query
  - 22x faster than Ollama
- 🔄 Anthropic Claude 3.5 Sonnet - Ready for testing
- 🔄 Google Gemini 1.5 Pro - Ready for testing

**Comparison Framework:**
- ✅ Track: response quality, latency, cost, citation accuracy
- ✅ Infrastructure for provider switching
- 📋 Document findings in docs/evaluation.md (in progress)

**Implementation:**

```python
class LLMService:
    def __init__(self, provider="openai", model="gpt-4-turbo-preview"):
        self.provider = provider
        self.model = model
    
    async def generate_response(self, prompt, context, stream=True):
        if self.provider == "ollama":
            return await self._ollama_generate(prompt, context, stream)
        elif self.provider == "openai":
            return await self._openai_generate(prompt, context, stream)
        elif self.provider == "anthropic":
            return await self._anthropic_generate(prompt, context, stream)
```

---

## Phase 3: Frontend Development 🎯 STARTING NOW (Week 3-5)

**Status:** Ready to begin - this is the current priority

### 3.1 Next.js Setup & Project Structure

**Next.js 14 with App Router:**
- Server components for SEO and performance
- Client components for interactivity
- API routes as proxy to FastAPI backend
- Tailwind CSS for styling

**Page Structure:**

```
app/
├── layout.tsx              # Root layout with navigation
├── page.tsx                # Home page (intro + chat preview)
├── chat/
│   └── page.tsx           # Main chat interface
├── notes/
│   ├── page.tsx           # Note browser (category grid)
│   ├── [category]/
│   │   └── page.tsx       # Category view (book list)
│   └── [id]/
│       └── page.tsx       # Individual note viewer
└── about/
    └── page.tsx           # Project documentation for admissions
```

### 3.2 Chat Interface Component

**Features:**
- Message thread with user/AI distinction
- Streaming response animation (typewriter effect)
- Citation chips that link to note viewer
- "Related Notes" suggestions after each response
- Conversation history sidebar
- Export conversation as PDF/markdown

**UX Design:**
- Clean, calming aesthetic (spiritual theme)
- Soft color palette (blues, purples, earth tones)
- Smooth animations and transitions
- Responsive design (mobile-first)
- Accessibility (keyboard navigation, screen readers)

**React Component Structure:**

```jsx
<ChatPage>
  <ChatSidebar conversations={} />
  <ChatContainer>
    <MessageList messages={} />
    <CitationPanel citations={} />
    <MessageInput onSend={} />
  </ChatContainer>
  <RelatedNotes suggestions={} />
</ChatPage>
```

### 3.3 Note Browser & Viewer

**Category Browser:**
- Card grid showing categories (Spiritual, Self-Help, Science, etc.)
- Book count and preview for each category (11 categories, 75 books)
- Search bar with instant filtering
- Tag cloud for quick navigation

**Note Viewer:**
- Markdown rendering with syntax highlighting
- Bidirectional link clicking (Obsidian-style [[links]])
- Breadcrumb navigation (Category > Book > Note)
- "Chat about this note" quick action
- Related notes sidebar (based on embeddings)
- Book citation display (if present in note)

**Technologies:**
- `react-markdown` for rendering
- `remark` plugins for Obsidian link parsing
- `rehype` for code highlighting
- Custom link component for internal navigation

### 3.4 Learning JavaScript & React

**Learning Path (integrated into development):**

**Week 1-2: JavaScript Fundamentals**
- Variables, functions, async/await
- Array methods (map, filter, reduce)
- ES6+ features (destructuring, spread, arrow functions)
- Promises and API calls with fetch
- Practice: Build small utilities in frontend/src/lib/

**Week 3-4: React Basics**
- Components (functional components, JSX)
- Props and state (useState, useEffect)
- Event handling and forms
- Component composition
- Practice: Build small components (Button, Card, Modal)

**Week 5: Next.js & Advanced React**
- Server vs client components
- Routing and navigation
- Data fetching strategies
- Custom hooks
- Practice: Implement chat and note viewer features

**Resources:**
- MDN Web Docs (JavaScript reference)
- React official documentation (excellent tutorial)
- Next.js documentation (learn by building)
- YouTube: Web Dev Simplified, Fireship

---

## Phase 4: Advanced Features & Polish (Week 6-7)

### 4.1 Enhanced Search

- Full-text search across all notes
- Semantic search with explanation (why this note?)
- Filter by category, book, tags
- Search history and saved searches

### 4.2 Conversation Features

- Save/load conversation threads
- Share conversations (generate shareable link)
- Export conversation as markdown with citations
- Conversation analytics (topics discussed, notes referenced)

### 4.3 Analytics & Insights

**For Academic Documentation:**
- RAG performance metrics (retrieval accuracy, citation usage)
- Model comparison dashboard
- User interaction patterns (most queried topics)
- Response quality evaluation (thumbs up/down)

**Implementation:**
- Log all queries and responses (anonymized)
- Track: latency, token usage, cost (for API models)
- Visualize in simple dashboard
- Document in docs/evaluation.md

### 4.4 UI/UX Refinement

- Loading states and skeletons
- Error handling with user-friendly messages
- Keyboard shortcuts (e.g., / to focus search)
- Dark mode toggle
- Responsive design testing (mobile, tablet, desktop)
- Accessibility audit (ARIA labels, focus management)

---

## Phase 5: Testing & Evaluation (Week 7-8)

### 5.1 Testing Strategy

**Backend Tests:**
- Unit tests for Obsidian parser (edge cases, malformed markdown)
- Integration tests for RAG pipeline (query → retrieval → generation)
- API endpoint tests (FastAPI TestClient)
- Load testing (simulate multiple users)

**Frontend Tests:**
- Component tests (React Testing Library)
- E2E tests (Playwright) for critical flows
- Accessibility testing (axe-core)

**Testing Framework:**

```
backend/tests/
├── test_obsidian_parser.py
├── test_embedding_service.py
├── test_rag_engine.py
└── test_api_endpoints.py

frontend/tests/
├── components/
│   ├── ChatInterface.test.tsx
│   └── NoteViewer.test.tsx
└── e2e/
    ├── chat-flow.spec.ts
    └── note-navigation.spec.ts
```

### 5.2 Model Evaluation

**Comparison Metrics:**
- Quality: Human evaluation (coherence, helpfulness, accuracy)
- Citation Accuracy: Does AI correctly reference notes?
- Latency: Time to first token, total response time
- Cost: API pricing vs free local models
- Context Utilization: Does AI use retrieved context effectively?

**Methodology:**
- Create test dataset (20-30 diverse questions)
- Generate responses with each model
- Blind human evaluation (rank responses)
- Document in docs/evaluation.md with charts

### 5.3 Documentation for Admissions

**Academic Documentation Package:**

**README.md:**
- Project motivation and goals
- Technical approach and architecture
- Key technologies and justification
- Setup and running instructions
- Demo screenshots/GIFs
- Links to live demo (if deployed)

**docs/architecture.md:**
- System design diagram
- RAG pipeline explanation
- Obsidian integration strategy
- Scalability considerations

**docs/rag-pipeline.md:**
- Embedding model selection
- Chunking strategy and rationale
- Retrieval algorithm (hybrid search)
- Prompt engineering techniques

**docs/evaluation.md:**
- Model comparison results
- Performance metrics with charts
- Cost-benefit analysis
- Future improvements

**docs/challenges.md:**
- Technical challenges faced
- Solutions implemented
- Lessons learned
- Trade-offs made

**GitHub Best Practices:**
- Clear commit messages (conventional commits)
- Branch strategy (feature branches)
- Pull requests with descriptions (even if solo project)
- Issues for tracking bugs/features
- Project board showing progress
- CI/CD pipeline (GitHub Actions)

---

## Phase 6: Deployment & Finalization (Week 8)

### 6.1 Dockerization

**Backend Dockerfile:**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

**Docker Compose:**
- Backend, frontend, ChromaDB containers
- Shared volume for persistent vector store
- Environment variables for API keys

### 6.2 Deployment Strategy

**Frontend: Vercel**
- One-click deployment from GitHub
- Automatic HTTPS and CDN
- Preview deployments for branches
- Free tier sufficient for demo

**Backend: Railway / Render**
- Deploy from GitHub (auto-deploy on push)
- Environment variables for API keys
- Persistent volumes for ChromaDB
- Free tier has limitations (consider for demo)

**Alternative: Single VPS (DigitalOcean, Linode)**
- Docker Compose deployment
- Nginx reverse proxy
- SSL with Let's Encrypt
- More control, requires setup

### 6.3 Final Polish

- Performance: Lazy loading, code splitting, caching
- SEO: Meta tags, sitemap, Open Graph tags
- Monitoring: Error tracking (Sentry), analytics (Plausible)
- Security: API rate limiting, input sanitization, HTTPS
- Documentation: Update README with live demo link

---

## Technology Justification (For Academic Review)

### Why FastAPI?
- Async support: Handle multiple concurrent requests efficiently
- Type safety: Pydantic models prevent bugs
- Auto documentation: OpenAPI/Swagger for testing
- Modern Python: Leverages latest Python features

### Why React + Next.js?
- Industry standard: Most in-demand frontend skills
- Server-side rendering: Better SEO and performance
- Component architecture: Reusable, maintainable code
- Large ecosystem: Many libraries and community support

### Why ChromaDB → Pinecone?
- ChromaDB: Easy local development, fast iteration
- Pinecone: Production-grade, serverless, managed infrastructure
- Migration path: Simple API swap for scaling

### Why Hybrid LLM Strategy?
- Academic rigor: Compare approaches with data
- Cost awareness: Demonstrate understanding of trade-offs
- Practical: Start free, scale to paid as needed
- Evaluation: Quantify differences for admissions portfolio
- **Result: OpenAI 22x faster than Ollama (15s vs 340s)**

### Why RAG over Fine-tuning?
- Updatable: Add new notes without retraining
- Transparent: Can see which notes influenced response
- Cost-effective: No expensive fine-tuning runs
- Flexible: Easy to adjust retrieval strategy

---

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|-------------|
| 1 | Setup + Data Pipeline | ✅ GitHub repo, Obsidian parser, embeddings |
| 2 | Backend API | ✅ FastAPI endpoints, RAG pipeline, LLM integration |
| 3 | Frontend Foundation | 🎯 Next.js setup, basic chat UI, note browser |
| 4 | Frontend Features | Note viewer, markdown rendering, routing |
| 5 | Integration | Connect frontend/backend, streaming, citations |
| 6 | Advanced Features | Search, conversation history, analytics |
| 7 | Testing + Evaluation | Unit tests, model comparison, documentation |
| 8 | Deployment + Polish | Docker, deploy, final documentation |

---

## Success Criteria for Admissions

✅ **Technical Depth:** RAG pipeline, vector databases, API integration  
✅ **ML/AI Knowledge:** Embeddings, semantic search, LLM comparison  
✅ **Software Engineering:** Clean code, testing, documentation  
✅ **Problem Solving:** Obsidian integration, citation tracking  
✅ **Full-Stack Skills:** Backend API, modern frontend, deployment  
✅ **Academic Rigor:** Evaluation metrics, documented trade-offs  
✅ **Portfolio Quality:** Live demo, clear GitHub, impressive UI

---

## To-Dos: Completed In Order

### ✅ Completed (14/19)

1. ✅ Initialize GitHub repo with folder structure, README, and documentation templates
2. ✅ Build Obsidian vault parser to extract notes, metadata, and links
3. ✅ Implement text chunking and generate embeddings with sentence-transformers
4. ✅ Set up ChromaDB and ingest processed notes with metadata
5. ✅ Create FastAPI application structure with core endpoints
6. ✅ Build RAG pipeline: query embedding, context retrieval, re-ranking
7. ✅ Integrate Ollama with Llama 3.1 for local response generation
8. ✅ Add OpenAI and Anthropic API support for model comparison
9. ✅ Initialize Next.js 14 project with Tailwind CSS and folder structure
10. ✅ Build chat UI with message list, input, and streaming responses
11. ✅ Create note browser with category grid and search functionality
12. ✅ Implement citation parsing and linking from chat to notes
13. ✅ Add conversation persistence with localStorage (ChatGPT-style)
14. ✅ **Build tree structure parser and note viewer**
    - ✅ Parse [[wiki links]] and build parent-child relationships (69 books detected)
    - ✅ Flexible root note detection (supports multiple naming patterns)
    - ✅ Create tree navigation API endpoints (3 new endpoints)
    - ✅ Implement frontend note viewer with hierarchical breadcrumbs
    - ✅ Display child links and sibling navigation
    - ✅ Category pages with book grids (hierarchical) and note lists (flat)

### 🎯 Next Priority (Enhanced Features)

15. ⏭️ Create category detail pages with filters and sorting
16. ⏭️ Implement conversation history sidebar UI

### 📋 Remaining (Future Phases)

14. ⏭️ Implement semantic search UI with filters and explanations
15. ⏭️ Write unit and integration tests for backend and frontend
16. ⏭️ Conduct model comparison with evaluation metrics and documentation
17. ⏭️ Create Dockerfiles and docker-compose for full application
18. ⏭️ Deploy frontend to Vercel and backend to Railway/Render
19. ⏭️ Complete academic documentation with architecture diagrams and evaluation results

---

## Next Immediate Steps (Ready for Frontend Development)

1. **Initialize Next.js 14 project** in `/Users/francescocavina/Documents/Coding/Projects/NLP Chatbot/frontend/`
2. **Set up folder structure** following Phase 3.1 specifications
3. **Build chat interface** first (highest priority, Phase 3.2)
4. **Connect to backend API** at http://localhost:8000
5. **Learn JavaScript/React** concepts along the way (Phase 3.4)
6. **Maintain clean Git commits** with conventional commit format

**Backend is complete and ready to serve the frontend!**
- API running on http://127.0.0.1:8000
- OpenAI GPT-4 Turbo tested and working (~15s response time)
- 1,772 chunks indexed from 1,649 notes
- All endpoints operational and documented

