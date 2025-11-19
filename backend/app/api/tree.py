"""
Tree Navigation API Endpoints
Provides endpoints for hierarchical note navigation
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path

from app.services.tree_parser import TreeParser
from app.services.obsidian_parser import parse_vault
from app.models.note import Note

router = APIRouter(prefix="/api/tree", tags=["tree"])
logger = logging.getLogger(__name__)

# Global cache for trees (will be populated on startup)
_trees_cache: Dict[str, Any] = {}
_all_notes: List[Note] = []
_parser: Optional[TreeParser] = None

# Vault path
VAULT_PATH = "/Users/francescocavina/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Books"


def initialize_trees():
    """
    Initialize tree structures on server startup
    Parse all notes and build tree structures
    """
    global _trees_cache, _all_notes, _parser
    
    logger.info("Initializing tree structures...")
    
    # Parse vault
    notes, stats = parse_vault(VAULT_PATH)
    _all_notes = notes
    _parser = TreeParser()
    
    # Find all root notes and build trees
    root_notes = _parser.find_root_notes(notes)
    logger.info(f"Found {len(root_notes)} root notes")
    
    for root_note in root_notes:
        try:
            logger.info(f"Building tree for: {root_note.title} ({root_note.category})")
            tree = _parser.build_tree(root_note, notes)
            
            # Cache using category/book as key
            category = root_note.category
            # Extract book name from title (remove "Notes - " prefix)
            book_name = root_note.title.replace("Notes - ", "").replace("notes - ", "")
            
            cache_key = f"{category}/{book_name}"
            _trees_cache[cache_key] = tree
            logger.info(f"  ✓ Cached tree: {cache_key} ({len(tree.children)} chapters)")
        
        except Exception as e:
            logger.error(f"Error building tree for {root_note.title}: {e}", exc_info=True)
    
    logger.info(f"✓ Initialized {len(_trees_cache)} tree structures")


@router.get("/books")
async def get_all_books():
    """
    Get list of all books with tree structures
    
    Returns:
        List of books organized by category
    """
    if not _trees_cache:
        initialize_trees()
    
    # Organize by category
    books_by_category: Dict[str, List[Dict]] = {}
    
    for cache_key, tree in _trees_cache.items():
        category, book_name = cache_key.split("/", 1)
        
        if category not in books_by_category:
            books_by_category[category] = []
        
        books_by_category[category].append({
            "book_name": book_name,
            "title": tree.note.title,
            "file_path": tree.note.file_path,
            "chapter_count": len(tree.children),
            "note_count": count_all_nodes(tree)
        })
    
    return {
        "categories": books_by_category,
        "total_books": len(_trees_cache)
    }


@router.get("/{category}/{book_name}")
async def get_book_tree(category: str, book_name: str):
    """
    Get complete tree structure for a book
    
    Args:
        category: Category name (e.g., "Spiritual")
        book_name: Book name (e.g., "A New Earth")
    
    Returns:
        Complete tree structure
    """
    if not _trees_cache:
        initialize_trees()
    
    cache_key = f"{category}/{book_name}"
    
    if cache_key not in _trees_cache:
        raise HTTPException(
            status_code=404,
            detail=f"Tree not found for {category}/{book_name}"
        )
    
    tree = _trees_cache[cache_key]
    
    return {
        "category": category,
        "book_name": book_name,
        "tree": tree.to_dict(),
        "statistics": {
            "total_notes": count_all_nodes(tree),
            "max_depth": get_max_depth(tree),
            "chapter_count": len(tree.children)
        }
    }


@router.get("/navigation/{file_path:path}")
async def get_navigation_context(file_path: str):
    """
    Get navigation context for a specific note
    
    Args:
        file_path: Path to the note (e.g., "Spiritual/A New Earth/files/Chapter 2.md")
    
    Returns:
        Navigation context with breadcrumbs, children, siblings, parent
    """
    if not _trees_cache:
        initialize_trees()
    
    if not _parser or not _all_notes:
        raise HTTPException(status_code=500, detail="Tree parser not initialized")
    
    # Find the note
    note = next((n for n in _all_notes if n.file_path == file_path), None)
    
    if not note:
        raise HTTPException(status_code=404, detail=f"Note not found: {file_path}")
    
    # Find the tree containing this note
    tree = None
    for cached_tree in _trees_cache.values():
        if _find_note_in_tree(cached_tree, note.id):
            tree = cached_tree
            break
    
    if not tree:
        # This note is not part of any tree (it's a standalone note)
        return {
            "note": {
                "id": note.id,
                "title": note.title,
                "file_path": note.file_path,
                "category": note.category,
                "book": note.book
            },
            "is_in_tree": False,
            "breadcrumbs": [],
            "children": [],
            "siblings": [],
            "parent": None
        }
    
    # Get navigation context
    context = _parser.get_navigation_context(note, tree)
    
    return {
        "note": {
            "id": note.id,
            "title": note.title,
            "file_path": note.file_path,
            "category": note.category,
            "book": note.book
        },
        "is_in_tree": True,
        **context
    }


@router.post("/rebuild")
async def rebuild_trees():
    """
    Rebuild all tree structures (admin endpoint)
    
    Use this after notes are updated or re-ingested
    """
    global _trees_cache
    _trees_cache.clear()
    
    initialize_trees()
    
    return {
        "status": "success",
        "message": f"Rebuilt {len(_trees_cache)} tree structures"
    }


# Helper functions

def count_all_nodes(tree) -> int:
    """Count total nodes in tree"""
    count = 1  # Count this node
    for child in tree.children:
        count += count_all_nodes(child)
    return count


def get_max_depth(tree) -> int:
    """Get maximum depth of tree"""
    if not tree.children:
        return tree.depth
    return max(get_max_depth(child) for child in tree.children)


def _find_note_in_tree(tree, note_id: str) -> bool:
    """Check if note exists in tree"""
    if tree.note.id == note_id:
        return True
    return any(_find_note_in_tree(child, note_id) for child in tree.children)

