"""Notes API endpoints"""

from fastapi import APIRouter, HTTPException
from typing import List
import json
import logging
from pathlib import Path

from app.models.api import NoteResponse, CategoriesResponse, CategoryInfo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notes", tags=["notes"])

# Cache for notes (loaded from JSON)
_notes_cache = None


def load_notes():
    """Load notes from JSON file"""
    global _notes_cache
    
    if _notes_cache is not None:
        return _notes_cache
    
    notes_file = Path("../data/processed/notes.json")
    
    if not notes_file.exists():
        logger.warning(f"Notes file not found: {notes_file}")
        return []
    
    try:
        with open(notes_file, 'r', encoding='utf-8') as f:
            _notes_cache = json.load(f)
        
        logger.info(f"Loaded {len(_notes_cache)} notes from cache")
        return _notes_cache
    
    except Exception as e:
        logger.error(f"Error loading notes: {e}")
        return []


@router.get("", response_model=List[NoteResponse])
async def get_notes(
    category: str = None,
    book: str = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Get notes with optional filtering
    
    Args:
        category: Filter by category
        book: Filter by book
        limit: Maximum number of notes to return
        offset: Offset for pagination
    """
    try:
        notes = load_notes()
        
        # Apply filters
        filtered_notes = notes
        
        if category:
            filtered_notes = [n for n in filtered_notes if n.get('category') == category]
        
        if book:
            filtered_notes = [n for n in filtered_notes if n.get('book') == book]
        
        # Apply pagination
        paginated_notes = filtered_notes[offset:offset + limit]
        
        # Convert to response model
        response_notes = []
        for note in paginated_notes:
            response_notes.append(
                NoteResponse(
                    id=note['id'],
                    title=note['title'],
                    content=note['content'],
                    category=note['category'],
                    book=note.get('book'),
                    file_path=note['file_path'],
                    links=note.get('links', []),
                    word_count=note['word_count'],
                    related_notes=[]  # TODO: Add related notes via embeddings
                )
            )
        
        return response_notes
    
    except Exception as e:
        logger.error(f"Error getting notes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note_by_id(note_id: str):
    """Get a specific note by ID"""
    try:
        notes = load_notes()
        
        # Find note
        note = next((n for n in notes if n['id'] == note_id), None)
        
        if not note:
            raise HTTPException(status_code=404, detail=f"Note not found: {note_id}")
        
        return NoteResponse(
            id=note['id'],
            title=note['title'],
            content=note['content'],
            category=note['category'],
            book=note.get('book'),
            file_path=note['file_path'],
            links=note.get('links', []),
            word_count=note['word_count'],
            related_notes=[]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting note {note_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories/list", response_model=CategoriesResponse)
async def get_categories():
    """Get all categories with note counts"""
    try:
        notes = load_notes()
        
        # Count notes by category
        category_counts = {}
        for note in notes:
            cat = note.get('category', 'Unknown')
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        # Create category info list
        categories = []
        for cat_name, count in sorted(category_counts.items()):
            categories.append(
                CategoryInfo(
                    id=cat_name.lower().replace(' ', '-'),
                    name=cat_name,
                    count=count,
                    description=None
                )
            )
        
        return CategoriesResponse(
            categories=categories,
            total_notes=len(notes),
            total_categories=len(categories)
        )
    
    except Exception as e:
        logger.error(f"Error getting categories: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

