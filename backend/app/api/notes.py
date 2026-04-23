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
    """Load notes from JSON file, or fall back to ChromaDB in Database Mode."""
    global _notes_cache
    
    if _notes_cache is not None:
        return _notes_cache

    notes_file = Path("../data/processed/notes.json")

    if notes_file.exists():
        try:
            with open(notes_file, 'r', encoding='utf-8') as f:
                _notes_cache = json.load(f)
            logger.info(f"Loaded {len(_notes_cache)} notes from JSON cache")
            return _notes_cache
        except Exception as e:
            logger.error(f"Error loading notes from JSON: {e}")

    # --- Database Mode: load from ChromaDB ---
    logger.info("notes.json not found — loading note metadata from ChromaDB")
    try:
        from app.services.vector_db import get_vector_db
        vector_db = get_vector_db()

        # Fetch all stored metadata (no embeddings needed)
        results = vector_db.collection.get(include=["metadatas"])
        metadatas = results.get("metadatas", [])
        ids = results.get("ids", [])

        # De-duplicate by note_id (multiple chunks per note)
        seen = {}
        for i, meta in enumerate(metadatas):
            note_id = meta.get("note_id") or ids[i]
            if note_id not in seen:
                seen[note_id] = {
                    "id": note_id,
                    "title": meta.get("title", "Untitled"),
                    "content": "",          # chunks not needed for listing
                    "category": meta.get("category", "Unknown"),
                    "book": meta.get("book"),
                    "file_path": meta.get("file_path", ""),
                    "links": [],
                    "word_count": int(meta.get("word_count", 0)),
                }

        _notes_cache = list(seen.values())
        logger.info(f"Loaded {len(_notes_cache)} unique notes from ChromaDB metadata")
        return _notes_cache

    except Exception as e:
        logger.error(f"ChromaDB fallback failed: {e}", exc_info=True)
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


@router.get("/{note_id:path}", response_model=NoteResponse)
async def get_note_by_id(note_id: str):
    """
    Get a specific note by ID or file path.
    Always fetches full content from ChromaDB — the listing cache 
    only holds metadata (content=""), so we bypass it here.
    """
    try:
        # --- Always go straight to ChromaDB for full content ---
        # The listing cache has content="" by design, so we can't
        # use it for individual note pages.
        logger.info(f"Fetching full note content from ChromaDB for: {note_id}")
        from app.services.vector_db import get_vector_db
        vector_db = get_vector_db()

        # Query ChromaDB for all chunks with matching file_path
        results = vector_db.collection.get(
            where={"file_path": note_id},
            include=["documents", "metadatas"]
        )

        if not results['ids'] or len(results['ids']) == 0:
            # Try matching by note_id field as fallback
            results = vector_db.collection.get(
                where={"note_id": note_id},
                include=["documents", "metadatas"]
            )

        if not results['ids'] or len(results['ids']) == 0:
            raise HTTPException(status_code=404, detail=f"Note not found: {note_id}")

        # Sort chunks by chunk_index to preserve reading order
        chunks = list(zip(results['ids'], results['documents'], results['metadatas']))
        chunks.sort(key=lambda x: int(x[2].get('chunk_index', 0)))

        chunks_metadata = [c[2] for c in chunks]
        chunks_text = [c[1] for c in chunks]

        first_metadata = chunks_metadata[0]

        # Combine all chunk texts in order
        full_content = "\n\n".join(chunks_text)

        # Extract links from all chunks
        all_links = set()
        for metadata in chunks_metadata:
            links_str = metadata.get('links', '[]')
            try:
                links = json.loads(links_str) if isinstance(links_str, str) else links_str
                if isinstance(links, list):
                    all_links.update(links)
            except (json.JSONDecodeError, TypeError):
                pass

        return NoteResponse(
            id=first_metadata.get('note_id', note_id),
            title=first_metadata.get('title', 'Untitled'),
            content=full_content,
            category=first_metadata.get('category', 'Unknown'),
            book=first_metadata.get('book') or None,
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

