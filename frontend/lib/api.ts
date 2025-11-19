/**
 * API Client for Backend Communication
 * 
 * This file handles all communication with the FastAPI backend.
 * It provides typed functions for each endpoint.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Type Definitions
 * These match the backend Pydantic models
 */

export interface Note {
  id: string;
  title: string;
  category: string;
  book?: string;
  file_path: string;
  content: string;
  links?: string[];
  created_at?: string;
}

export interface Citation {
  title: string;
  category: string;
  book?: string | null;
  file_path: string;
  snippet: string;
  relevance_score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  provider?: 'openai' | 'ollama' | 'anthropic' | 'google';
  category_filter?: string;
}

// Tree Navigation Types
export interface TreeNode {
  id: string;
  title: string;
  file_path: string;
  is_root: boolean;
  is_leaf: boolean;
  depth: number;
  children_count: number;
  wiki_links: string[];
  children: TreeNode[];
}

export interface BookMetadata {
  book_name: string;
  title: string;
  file_path: string;
  chapter_count: number;
  note_count: number;
}

export interface BookTreeResponse {
  category: string;
  book_name: string;
  tree: TreeNode;
}

export interface BreadcrumbItem {
  title: string;
  file_path: string;
}

export interface NavigationContext {
  note: {
    id: string;
    title: string;
    file_path: string;
    category: string;
    book: string | null;
  };
  is_in_tree: boolean;
  breadcrumbs: BreadcrumbItem[];
  parent: BreadcrumbItem | null;
  siblings: BreadcrumbItem[];
  children: BreadcrumbItem[];
  is_leaf: boolean;
  depth: number;
}

export interface SearchResult {
  chunk_id: string;
  title: string;
  category: string;
  book?: string | null;
  file_path: string;
  text: string;
  relevance_score: number;
}

export interface Stats {
  total_notes: number;
  total_chunks: number;
  categories: { [key: string]: number };
  embedding_model: string;
}

/**
 * API Functions
 */

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) throw new Error('Backend health check failed');
  return response.json();
}

/**
 * Get database statistics
 * 
 * Note: Backend has this at /stats (root level), not /api/stats
 */
export async function getStats(): Promise<Stats> {
  const response = await fetch(`${API_BASE_URL}/stats`);
  if (!response.ok) throw new Error('Failed to fetch stats');
  return response.json();
}

/**
 * Semantic search across all notes
 */
export async function searchNotes(
  query: string,
  topK: number = 10,
  categoryFilter?: string
): Promise<SearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      top_k: topK,
      category_filter: categoryFilter,
    }),
  });
  
  if (!response.ok) throw new Error('Search failed');
  const data = await response.json();
  return data.results || [];
}

/**
 * Get all notes with optional filtering
 */
export async function getNotes(category?: string): Promise<Note[]> {
  const url = category 
    ? `${API_BASE_URL}/api/notes?category=${encodeURIComponent(category)}`
    : `${API_BASE_URL}/api/notes`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch notes');
  return response.json();
}

/**
 * Get a specific note by ID
 */
export async function getNoteById(noteId: string): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/api/notes/${encodeURIComponent(noteId)}`);
  if (!response.ok) throw new Error('Failed to fetch note');
  return response.json();
}

/**
 * Get list of all categories with counts
 */
export async function getCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/notes/categories/list`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  const data = await response.json();
  // Backend returns CategoriesResponse, extract just the category names
  return data.categories ? data.categories.map((c: any) => c.name) : [];
}

/**
 * Chat with RAG - Streaming Response
 * 
 * This function returns a ReadableStream for streaming responses.
 * The backend uses Server-Sent Events (SSE) for real-time updates.
 * 
 * IMPORTANT: Calls /api/chat/stream (not /api/chat)
 */
export async function chatWithStreaming(
  request: ChatRequest
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) throw new Error('Chat request failed');
  if (!response.body) throw new Error('No response body');
  
  return response.body;
}

/**
 * Parse Server-Sent Events stream
 * 
 * Helper function to parse SSE data from the chat endpoint.
 * Yields each message as it arrives.
 * 
 * Backend format:
 * - {"type": "text", "data": "word"}
 * - {"type": "citations", "data": [...]}
 * - {"type": "done", "model": "openai"}
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<{ type: string; content: string; citations?: Citation[] }> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            
            // Transform backend format to frontend format
            if (parsed.type === 'text') {
              // Backend: {"type": "text", "data": "word"}
              // Frontend: {"type": "token", "content": "word"}
              yield {
                type: 'token',
                content: parsed.data || '',
              };
            } else if (parsed.type === 'citations') {
              // Backend: {"type": "citations", "data": [...]}
              // Frontend: {"type": "citations", "citations": [...]}
              yield {
                type: 'citations',
                content: '',
                citations: parsed.data || [],
              };
            } else if (parsed.type === 'done') {
              // Done signal
              return;
            } else if (parsed.type === 'error') {
              console.error('Stream error:', parsed.data);
              throw new Error(parsed.data);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', data, e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Chat without streaming (simpler, but less responsive)
 */
export async function chat(request: ChatRequest): Promise<{
  response: string;
  citations: Citation[];
}> {
  const stream = await chatWithStreaming(request);
  let fullResponse = '';
  let citations: Citation[] = [];

  for await (const message of parseSSEStream(stream)) {
    if (message.type === 'token') {
      fullResponse += message.content;
    } else if (message.type === 'citations') {
      citations = message.citations || [];
    }
  }

  return { response: fullResponse, citations };
}

/**
 * Tree Navigation API Functions
 */

/**
 * Get all books grouped by category
 */
export async function getAllBooks(): Promise<Record<string, BookMetadata[]>> {
  const res = await fetch(`${API_BASE_URL}/api/tree/books`);
  if (!res.ok) throw new Error('Failed to fetch books');
  const data = await res.json();
  return data.categories;
}

/**
 * Get full tree structure for a specific book
 */
export async function getBookTree(category: string, bookName: string): Promise<BookTreeResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/tree/${encodeURIComponent(category)}/${encodeURIComponent(bookName)}`
  );
  if (!res.ok) throw new Error('Failed to fetch book tree');
  return res.json();
}

/**
 * Get navigation context for a specific note
 */
export async function getNoteNavigation(filePath: string): Promise<NavigationContext> {
  const res = await fetch(
    `${API_BASE_URL}/api/tree/navigation/${encodeURIComponent(filePath)}`
  );
  if (!res.ok) throw new Error('Failed to fetch navigation context');
  return res.json();
}

