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


@router.get("/{note_id:path}", response_model=NoteResponse)
async def get_note_by_id(note_id: str):
    """
    Get a specific note by ID or file path
    
    Accepts either:
    - Note ID (from notes.json)
    - File path (e.g., "Spiritual/A New Earth/Note.md")
    
    Falls back to querying ChromaDB if notes.json doesn't exist
    """
    try:
        # Try loading from notes.json first
        notes = load_notes()
        
        if notes:
            # Try to find by ID or file_path
            note = next((n for n in notes if n['id'] == note_id or n['file_path'] == note_id), None)
            
            if note:
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
        
        # Fallback: Query ChromaDB to reconstruct note
        logger.info(f"Notes.json not found or note not in cache. Querying ChromaDB for: {note_id}")
        
        from app.services.vector_db import get_vector_db
        vector_db = get_vector_db()
        
        # Query ChromaDB for chunks with matching file_path
        results = vector_db.collection.get(
            where={"file_path": note_id},
            include=["documents", "metadatas"]
        )
        
        if not results['ids'] or len(results['ids']) == 0:
            raise HTTPException(status_code=404, detail=f"Note not found: {note_id}")
        
        # Reconstruct note from chunks
        chunks_metadata = results['metadatas']
        chunks_text = results['documents']
        
        # Get metadata from first chunk
        first_metadata = chunks_metadata[0]
        
        # Combine all chunk texts
        full_content = "\n\n".join(chunks_text)
        
        # Extract links from all chunks
        all_links = set()
        for metadata in chunks_metadata:
            links_str = metadata.get('links', '[]')
            try:
                links = eval(links_str) if isinstance(links_str, str) else links_str
                if isinstance(links, list):
                    all_links.update(links)
            except:
                pass
        
        return NoteResponse(
            id=first_metadata.get('note_id', note_id),
            title=first_metadata.get('title', 'Untitled'),
            content=full_content,
            category=first_metadata.get('category', 'Unknown'),
            book=first_metadata.get('book'),
            file_path=note_id,
            links=list(all_links),
            word_count=len(full_content.split()),
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

