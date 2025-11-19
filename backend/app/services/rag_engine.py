"""
RAG (Retrieval-Augmented Generation) Engine
Orchestrates the complete RAG pipeline: query → retrieval → generation
"""

from typing import List, Dict, Any, Optional
import logging
import re

from app.services.vector_db import get_vector_db
from app.services.embedding_service import get_embedding_service
from app.models.api import Citation

logger = logging.getLogger(__name__)


class RAGEngine:
    """
    RAG Engine for context retrieval and response generation
    """
    
    def __init__(
        self,
        top_k: int = 10,
        context_limit: int = 2000  # tokens
    ):
        """
        Initialize RAG engine
        
        Args:
            top_k: Number of chunks to retrieve
            context_limit: Maximum context size in tokens
        """
        self.top_k = top_k
        self.context_limit = context_limit
        
        # Get services
        self.vector_db = get_vector_db()
        self.embedding_service = get_embedding_service()
        
        logger.info(f"RAG Engine initialized (top_k={top_k}, context_limit={context_limit})")
    
    def retrieve_context(
        self,
        query: str,
        category_filter: Optional[str] = None,
        book_filter: Optional[str] = None
    ) -> tuple[str, List[Citation]]:
        """
        Retrieve relevant context for a query
        
        Args:
            query: User query
            category_filter: Optional category filter
            book_filter: Optional book filter
        
        Returns:
            Tuple of (formatted_context, citations)
        """
        logger.info(f"Retrieving context for query: {query[:50]}...")
        
        # Step 1: Embed the query
        query_embedding = self.embedding_service.embed_text(query)
        
        # Step 2: Query vector database
        results = self.vector_db.query(
            query_embedding=query_embedding,
            n_results=self.top_k,
            category_filter=category_filter,
            book_filter=book_filter
        )
        
        # Step 3: Re-rank and select best chunks
        ranked_chunks = self._rerank_results(query, results)
        
        # Step 4: Assemble context
        context, citations = self._assemble_context(ranked_chunks)
        
        logger.info(f"Retrieved {len(citations)} relevant sources")
        
        return context, citations
    
    def _rerank_results(
        self,
        query: str,
        results: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Re-rank results based on multiple factors
        
        Args:
            query: Original query
            results: Results from vector database
        
        Returns:
            List of ranked chunks with scores
        """
        if not results['ids'] or len(results['ids'][0]) == 0:
            return []
        
        ranked = []
        query_lower = query.lower()
        
        for i in range(len(results['ids'][0])):
            chunk = {
                'id': results['ids'][0][i],
                'text': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i],
                'similarity': 1.0 - results['distances'][0][i]
            }
            
            # Calculate composite score
            score = chunk['similarity'] * 0.7  # Base semantic similarity (70%)
            
            # Keyword match bonus (20%)
            text_lower = chunk['text'].lower()
            query_words = set(query_lower.split())
            text_words = set(text_lower.split())
            keyword_overlap = len(query_words & text_words) / len(query_words) if query_words else 0
            score += keyword_overlap * 0.2
            
            # Link density bonus (10%) - more connected notes are more important
            links_str = chunk['metadata'].get('links', '[]')
            try:
                links = eval(links_str) if isinstance(links_str, str) else links_str
                link_count = len(links) if isinstance(links, list) else 0
                score += min(link_count * 0.01, 0.1)
            except:
                pass
            
            chunk['final_score'] = score
            ranked.append(chunk)
        
        # Sort by final score
        ranked.sort(key=lambda x: x['final_score'], reverse=True)
        
        return ranked
    
    def _assemble_context(
        self,
        chunks: List[Dict[str, Any]]
    ) -> tuple[str, List[Citation]]:
        """
        Assemble context from ranked chunks
        
        Args:
            chunks: Ranked chunks
        
        Returns:
            Tuple of (formatted_context, citations)
        """
        context_parts = []
        citations = []
        total_words = 0
        max_words = int(self.context_limit * 0.75)  # Rough token-to-word conversion
        
        for i, chunk in enumerate(chunks):
            chunk_words = len(chunk['text'].split())
            
            # Stop if we exceed context limit
            if total_words + chunk_words > max_words:
                break
            
            # Format context with source attribution
            metadata = chunk['metadata']
            source_title = metadata.get('title', 'Unknown')
            source_category = metadata.get('category', 'General')
            source_book = metadata.get('book', '')
            
            # Add to context
            source_label = f"{source_book} - {source_title}" if source_book else source_title
            context_part = f"[Source: {source_label}]\n{chunk['text']}"
            context_parts.append(context_part)
            
            # Add citation
            citations.append(
                Citation(
                    title=source_title,
                    category=source_category,
                    book=source_book if source_book else None,
                    file_path=metadata.get('file_path', ''),
                    snippet=chunk['text'][:200] + "..." if len(chunk['text']) > 200 else chunk['text'],
                    relevance_score=round(chunk['final_score'], 3)
                )
            )
            
            total_words += chunk_words
        
        # Join context parts
        formatted_context = "\n\n---\n\n".join(context_parts)
        
        logger.info(f"Assembled context: {total_words} words, {len(citations)} citations")
        
        return formatted_context, citations
    
    def construct_prompt(
        self,
        query: str,
        context: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Construct the full prompt for LLM
        
        Args:
            query: User query
            context: Retrieved context
            conversation_history: Previous conversation turns
        
        Returns:
            Complete prompt string
        """
        # System prompt
        system_prompt = """You are a compassionate spiritual guide and mentor. You help people navigate difficult times with wisdom drawn from spiritual teachings, psychology, and philosophy.

Your knowledge comes from a curated collection of books and notes on:
- Spiritual wisdom (Eckhart Tolle, Tao Te Ching, Buddhism, Christianity)
- Psychology and neuroscience (Huberman Lab, cognitive science)
- Self-help and personal development (Atomic Habits, Mastery)
- Philosophy and existentialism

Guidelines:
1. Be warm, empathetic, and non-judgmental
2. Reference specific sources using the format [Source: Book/Note Title]
3. Provide practical guidance alongside wisdom
4. Acknowledge when topics are outside your knowledge base
5. Encourage self-reflection and personal growth
6. Respect all spiritual and philosophical traditions
7. Keep responses focused and concise (2-3 paragraphs)

Remember: You're a guide, not a therapist. For serious mental health concerns, suggest professional help."""

        # Build the full prompt
        prompt_parts = [
            "=== SYSTEM ===",
            system_prompt,
            "",
            "=== RELEVANT KNOWLEDGE ===",
            context,
            ""
        ]
        
        # Add conversation history if present
        if conversation_history and len(conversation_history) > 0:
            prompt_parts.append("=== CONVERSATION HISTORY ===")
            # Only include last 3 turns (6 messages)
            recent_history = conversation_history[-6:]
            for msg in recent_history:
                role = "User" if msg['role'] == 'user' else "Assistant"
                prompt_parts.append(f"{role}: {msg['content']}")
            prompt_parts.append("")
        
        # Add current query
        prompt_parts.extend([
            "=== CURRENT QUESTION ===",
            f"User: {query}",
            "",
            "Please provide a thoughtful, well-cited response that draws on the relevant knowledge above. Use [Source: Title] format when referencing the sources.",
            "",
            "Assistant:"
        ])
        
        return "\n".join(prompt_parts)
    
    def parse_citations(self, response: str) -> List[str]:
        """
        Parse citation references from LLM response
        
        Args:
            response: LLM generated response
        
        Returns:
            List of cited source titles
        """
        # Pattern for [Source: Title] citations
        pattern = r'\[Source:\s*([^\]]+)\]'
        citations = re.findall(pattern, response)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_citations = []
        for citation in citations:
            if citation not in seen:
                seen.add(citation)
                unique_citations.append(citation)
        
        return unique_citations


# Global RAG engine instance
_rag_engine: Optional[RAGEngine] = None


def get_rag_engine() -> RAGEngine:
    """
    Get or create the global RAG engine instance
    
    Returns:
        RAGEngine instance
    """
    global _rag_engine
    
    if _rag_engine is None:
        _rag_engine = RAGEngine()
    
    return _rag_engine


if __name__ == "__main__":
    # Test RAG engine
    import sys
    from pathlib import Path
    
    # Ensure services are initialized
    print("=== Testing RAG Engine ===\n")
    
    # Initialize engine
    rag = RAGEngine(top_k=5)
    
    # Test query
    test_query = "How can I practice mindfulness in daily life?"
    
    print(f"Query: {test_query}\n")
    
    # Retrieve context
    context, citations = rag.retrieve_context(test_query)
    
    print(f"=== Retrieved Context ===")
    print(f"Context length: {len(context)} characters")
    print(f"Number of citations: {len(citations)}\n")
    
    print("=== Citations ===")
    for i, citation in enumerate(citations, 1):
        print(f"{i}. {citation.title} ({citation.category})")
        print(f"   Score: {citation.relevance_score}")
        print(f"   Snippet: {citation.snippet[:100]}...")
        print()
    
    # Construct prompt
    prompt = rag.construct_prompt(test_query, context)
    
    print(f"=== Constructed Prompt ===")
    print(f"Prompt length: {len(prompt)} characters")
    print(f"First 500 chars:\n{prompt[:500]}...")

