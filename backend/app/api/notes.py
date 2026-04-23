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
_title_index: dict = {}


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

def get_title_index() -> dict:
    """Build a title → file_path lookup from metadata only. Built once, then cached."""
    global _title_index
    if _title_index:
        return _title_index

    logger.info("Building title index from ChromaDB metadata (one-time)...")
    try:
        from app.services.vector_db import get_vector_db
        vector_db = get_vector_db()

        results = vector_db.collection.get(include=["metadatas"])

        for meta in results.get("metadatas", []):
            title = (meta.get("title") or "").strip()
            file_path = meta.get("file_path", "")
            if title and file_path:
                _title_index[title.lower()] = file_path

        logger.info(f"Title index built: {len(_title_index)} unique titles")
    except Exception as e:
        logger.error(f"Failed to build title index: {e}", exc_info=True)

    return _title_index


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
    try:
        logger.info(f"Fetching full note content from ChromaDB for: {note_id}")
        from app.services.vector_db import get_vector_db
        vector_db = get_vector_db()

        # --- Attempt 1: exact file_path match ---
        results = vector_db.collection.get(
            where={"file_path": note_id},
            include=["documents", "metadatas"]
        )

        # --- Attempt 2: exact note_id match ---
        if not results['ids']:
            results = vector_db.collection.get(
                where={"note_id": note_id},
                include=["documents", "metadatas"]
            )

        # --- Attempt 3: title index lookup (cheap — metadata-only, built once) ---
        if not results['ids']:
            logger.info(f"file_path/note_id lookup failed, trying title index for: {note_id}")
            title_index = get_title_index()
            search_title = note_id.lower().strip().removesuffix(".md")
            matched_file_path = title_index.get(search_title)

            if matched_file_path:
                logger.info(f"Title index matched '{note_id}' → '{matched_file_path}'")
                results = vector_db.collection.get(
                    where={"file_path": matched_file_path},
                    include=["documents", "metadatas"]
                )

        if not results['ids']:
            raise HTTPException(status_code=404, detail=f"Note not found: {note_id}")

        # Sort chunks by chunk_index for correct reading order
        chunks = list(zip(results['ids'], results['documents'], results['metadatas']))
        chunks.sort(key=lambda x: int(x[2].get('chunk_index', 0)))

        chunks_metadata = [c[2] for c in chunks]
        chunks_text = [c[1] for c in chunks]
        first_metadata = chunks_metadata[0]
        full_content = "\n\n".join(chunks_text)

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
            file_path=first_metadata.get('file_path', note_id),  # return REAL file_path
            links=list(all_links),
            word_count=len(full_content.split()),
            related_notes=[]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting note {note_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

