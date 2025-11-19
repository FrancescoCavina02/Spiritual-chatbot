"""API request and response models"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(..., description="User message", min_length=1, max_length=5000)
    conversation_id: Optional[str] = Field(None, description="Conversation ID for context")
    model: str = Field("llama3.1", description="LLM model to use")
    category_filter: Optional[str] = Field(None, description="Filter context by category")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "How can I practice mindfulness in daily life?",
                "model": "llama3.1",
                "category_filter": "Spiritual"
            }
        }


class Citation(BaseModel):
    """Citation reference in response"""
    title: str = Field(..., description="Note title")
    category: str = Field(..., description="Category")
    book: Optional[str] = Field(None, description="Book name")
    file_path: str = Field(..., description="File path")
    snippet: str = Field(..., description="Relevant snippet")
    relevance_score: float = Field(..., description="Relevance score (0-1)")


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    message: str = Field(..., description="AI response")
    conversation_id: str = Field(..., description="Conversation ID")
    citations: List[Citation] = Field(default_factory=list, description="Source citations")
    model_used: str = Field(..., description="Model that generated the response")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Mindfulness in daily life can be practiced...",
                "conversation_id": "conv_123",
                "citations": [
                    {
                        "title": "Present Moment Awareness",
                        "category": "Spiritual",
                        "book": "The Power of Now",
                        "file_path": "Spiritual/Power of Now/awareness.md",
                        "snippet": "The present moment is all we have...",
                        "relevance_score": 0.89
                    }
                ],
                "model_used": "llama3.1",
                "processing_time_ms": 1250.5
            }
        }


class SearchRequest(BaseModel):
    """Request model for semantic search"""
    query: str = Field(..., description="Search query", min_length=1, max_length=1000)
    n_results: int = Field(10, description="Number of results", ge=1, le=50)
    category_filter: Optional[str] = Field(None, description="Filter by category")
    book_filter: Optional[str] = Field(None, description="Filter by book")


class SearchResult(BaseModel):
    """Search result item"""
    chunk_id: str
    title: str
    category: str
    book: Optional[str]
    file_path: str
    text: str
    relevance_score: float


class SearchResponse(BaseModel):
    """Response model for search"""
    query: str
    results: List[SearchResult]
    total_results: int
    processing_time_ms: float


class NoteResponse(BaseModel):
    """Response model for note retrieval"""
    id: str
    title: str
    content: str
    category: str
    book: Optional[str]
    file_path: str
    links: List[str]
    word_count: int
    related_notes: List[str] = Field(default_factory=list, description="Related note titles")


class CategoryInfo(BaseModel):
    """Category information"""
    id: str
    name: str
    count: int
    description: Optional[str] = None


class CategoriesResponse(BaseModel):
    """Response model for categories endpoint"""
    categories: List[CategoryInfo]
    total_notes: int
    total_categories: int


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    version: str
    services: dict


class StatsResponse(BaseModel):
    """Statistics response"""
    total_chunks: int
    total_notes: int
    categories: dict
    books: dict
    embedding_model: str
    vector_db_size: int

