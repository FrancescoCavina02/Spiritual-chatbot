# Spiritual AI Guide - Frontend

Modern Next.js 14 frontend for the Spiritual AI Guide chatbot.

## 🚀 Features

### ✅ Implemented
- **Real-time Streaming Chat**: Token-by-token streaming responses with Server-Sent Events
- **Citation System**: Interactive chips linking to source notes with relevance scores
- **Semantic Search**: AI-powered search across 1,649 notes
- **Note Viewer**: Markdown rendering with Obsidian-style `[[wiki links]]`
- **Note Browser**: Beautiful category grid with metadata
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Beautiful UI**: Spiritual-themed gradients and animations
- **TypeScript**: Full type safety throughout
- **Custom Hooks**: `useChat` for reusable chat logic

### 🎨 Design System
- Purple/Indigo gradient color scheme
- Glass-morphism effects with backdrop blur
- Smooth animations and transitions
- Custom scrollbar styling
- Accessible focus states

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── layout.tsx           # Root layout with navigation
│   ├── page.tsx             # Home page with search
│   ├── chat/                # Chat interface
│   ├── notes/               # Note browser & viewer
│   └── about/               # Project documentation
├── components/
│   ├── chat/                # Chat components
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── CitationChip.tsx
│   │   └── CitationPanel.tsx
│   ├── notes/               # Note components
│   │   ├── SearchBar.tsx
│   │   ├── NoteViewer.tsx
│   │   └── MarkdownRenderer.tsx
│   └── layout/
│       └── Navigation.tsx
├── hooks/
│   └── useChat.ts           # Custom chat hook
├── lib/
│   ├── api.ts               # API client for backend
│   └── markdown-utils.ts    # Markdown processing
└── package.json
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Markdown**: react-markdown with plugins
- **State Management**: React Hooks
- **API Communication**: Fetch API with SSE

## 🏃 Getting Started

### Prerequisites
- Node.js 20+
- npm
- Backend running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🔌 Backend Integration

The frontend connects to the FastAPI backend via the API client (`lib/api.ts`):

### Endpoints Used
- `POST /api/chat` - Streaming chat with RAG
- `POST /api/search` - Semantic search
- `GET /api/notes` - List all notes
- `GET /api/notes/{id}` - Get specific note
- `GET /api/stats` - Database statistics
- `GET /api/categories/list` - Get categories

### Environment Variables
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

## 📚 Key Components

### ChatPage (`app/chat/page.tsx`)
Main chat interface using the `useChat` hook for state management.

### useChat Hook (`hooks/useChat.ts`)
Custom hook handling:
- Message history
- Streaming responses
- Citation management
- Error handling

### MarkdownRenderer (`components/notes/MarkdownRenderer.tsx`)
Renders markdown with:
- Obsidian `[[wiki links]]`
- Code syntax highlighting
- GitHub Flavored Markdown
- Custom styling

### SearchBar (`components/notes/SearchBar.tsx`)
Semantic search component with:
- Live search results
- Relevance scoring
- Category/book metadata
- Keyboard navigation

## 🎓 Learning Resources

This project demonstrates modern React/Next.js patterns:

### React Concepts
- **Functional Components**: Modern React component style
- **Hooks**: useState, useEffect, useRef
- **Custom Hooks**: Reusable logic extraction
- **Props & Composition**: Component communication

### Next.js 14 Features
- **App Router**: New routing paradigm
- **Server Components**: Default SSR
- **Client Components**: Interactive 'use client'
- **Dynamic Routes**: `[param]` syntax

### TypeScript Benefits
- Type safety for API responses
- Interface definitions
- Better IDE support
- Catch errors early

## 🐛 Troubleshooting

### Backend Connection Error
- Ensure backend is running on http://localhost:8000
- Check CORS configuration in backend
- Verify `.env.local` is created

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Regenerate types
npm run build
```

## 📝 Code Style

- **Formatting**: Next.js defaults
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: JSDoc style with explanations
- **Imports**: Absolute imports with `@/`

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variable in Vercel dashboard
NEXT_PUBLIC_API_URL=https://your-backend.com
```

### Docker
```bash
# Build
docker build -t spiritual-ai-frontend .

# Run
docker run -p 3000:3000 spiritual-ai-frontend
```

## 📈 Performance

- **Build Time**: ~2 seconds
- **Bundle Size**: Optimized with Turbopack
- **Static Generation**: Home, About pages
- **Dynamic Rendering**: Chat, Notes pages

## 🔐 Security

- No API keys in frontend code
- Environment variables for configuration
- CORS-protected backend
- Input sanitization for search

## 📄 License

MIT License - See root LICENSE file

---

**Built with ❤️ using Next.js 14 and TypeScript**
