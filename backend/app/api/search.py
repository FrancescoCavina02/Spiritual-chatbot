"""Search API endpoints"""

from fastapi import APIRouter, HTTPException
from typing import List
import time
import logging

from app.models.api import SearchRequest, SearchResponse, SearchResult
from app.services.vector_db import get_vector_db
from app.services.embedding_service import get_embedding_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])


@router.post("", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Perform semantic search across all notes
    
    Returns relevant chunks based on semantic similarity
    """
    start_time = time.time()
    
    try:
        # Get services
        vector_db = get_vector_db()
        embedding_service = get_embedding_service()
        
        # Generate query embedding
        query_embedding = embedding_service.embed_text(request.query)
        
        # Query vector database
        results = vector_db.query(
            query_embedding=query_embedding,
            n_results=request.n_results,
            category_filter=request.category_filter,
            book_filter=request.book_filter
        )
        
        # Format results
        search_results: List[SearchResult] = []
        
        if results['ids'] and len(results['ids'][0]) > 0:
            for i in range(len(results['ids'][0])):
                search_results.append(
                    SearchResult(
                        chunk_id=results['ids'][0][i],
                        title=results['metadatas'][0][i]['title'],
                        category=results['metadatas'][0][i]['category'],
                        book=results['metadatas'][0][i].get('book') or None,
                        file_path=results['metadatas'][0][i]['file_path'],
                        text=results['documents'][0][i],
                        relevance_score=1.0 - results['distances'][0][i]  # Convert distance to similarity
                    )
                )
        
        processing_time = (time.time() - start_time) * 1000
        
        return SearchResponse(
            query=request.query,
            results=search_results,
            total_results=len(search_results),
            processing_time_ms=processing_time
        )
    
    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/categories", response_model=List[str])
async def get_search_categories():
    """Get available categories for filtering"""
    try:
        vector_db = get_vector_db()
        stats = vector_db.get_statistics()
        return list(stats['categories'].keys())
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/books", response_model=List[str])
async def get_search_books():
    """Get available books for filtering"""
    try:
        vector_db = get_vector_db()
        stats = vector_db.get_statistics()
        return list(stats['books'].keys())
    except Exception as e:
        logger.error(f"Error getting books: {e}")
        raise HTTPException(status_code=500, detail=str(e))

