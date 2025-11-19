"""Pydantic models for notes and chunks"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Note(BaseModel):
    """Represents a parsed Obsidian note"""
    id: str = Field(..., description="Unique identifier for the note")
    title: str = Field(..., description="Note title")
    content: str = Field(..., description="Full note content")
    category: str = Field(..., description="Category (e.g., Spiritual, Self-Help)")
    book: Optional[str] = Field(None, description="Book or source name")
    file_path: str = Field(..., description="Relative path from vault root")
    links: List[str] = Field(default_factory=list, description="Obsidian links [[Note]]")
    word_count: int = Field(..., description="Number of words in content")
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "spiritual_a-new-earth_presence",
                "title": "Presence",
                "content": "There is space around my unhappiness...",
                "category": "Spiritual",
                "book": "A New Earth",
                "file_path": "Spiritual/A New Earth/files/Presence.md",
                "links": ["[[Ego]]", "[[Pain-Body]]"],
                "word_count": 150
            }
        }


class Chunk(BaseModel):
    """Represents a text chunk from a note"""
    id: str = Field(..., description="Unique chunk identifier")
    note_id: str = Field(..., description="Parent note ID")
    text: str = Field(..., description="Chunk content")
    chunk_index: int = Field(..., description="Position in note (0-based)")
    total_chunks: int = Field(..., description="Total chunks for this note")
    
    # Metadata (inherited from parent note)
    title: str = Field(..., description="Note title")
    category: str = Field(..., description="Category")
    book: Optional[str] = Field(None, description="Book name")
    file_path: str = Field(..., description="File path")
    links: List[str] = Field(default_factory=list, description="Links from parent note")
    
    # Embedding (populated later)
    embedding: Optional[List[float]] = Field(None, description="Vector embedding")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "spiritual_a-new-earth_presence_0",
                "note_id": "spiritual_a-new-earth_presence",
                "text": "There is space around my unhappiness...",
                "chunk_index": 0,
                "total_chunks": 1,
                "title": "Presence",
                "category": "Spiritual",
                "book": "A New Earth",
                "file_path": "Spiritual/A New Earth/files/Presence.md",
                "links": []
            }
        }


class NoteMetadata(BaseModel):
    """Metadata about the note collection"""
    total_notes: int
    total_chunks: int
    categories: dict[str, int]  # category -> count
    books: dict[str, int]  # book -> count
    total_words: int

