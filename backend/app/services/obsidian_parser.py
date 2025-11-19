"""
Obsidian Vault Parser
Parses markdown files from Obsidian vault and extracts structured data
"""

import re
import hashlib
from pathlib import Path
from typing import List, Optional, Tuple
import logging
from datetime import datetime

from app.models.note import Note

logger = logging.getLogger(__name__)


class ObsidianParser:
    """Parse Obsidian vault markdown files"""
    
    def __init__(self, vault_path: str):
        """
        Initialize parser with vault path
        
        Args:
            vault_path: Path to Obsidian vault root
        """
        self.vault_path = Path(vault_path)
        if not self.vault_path.exists():
            raise ValueError(f"Vault path does not exist: {vault_path}")
        
        logger.info(f"Initialized ObsidianParser for vault: {vault_path}")
    
    def parse_all_notes(self, exclude_patterns: Optional[List[str]] = None) -> List[Note]:
        """
        Parse all markdown files in the vault
        
        Args:
            exclude_patterns: List of patterns to exclude (e.g., ['.obsidian', 'templates'])
        
        Returns:
            List of parsed Note objects
        """
        if exclude_patterns is None:
            exclude_patterns = ['.obsidian', 'templates', 'Archive']
        
        notes = []
        markdown_files = list(self.vault_path.rglob("*.md"))
        
        logger.info(f"Found {len(markdown_files)} markdown files")
        
        for file_path in markdown_files:
            # Skip excluded paths
            if any(pattern in str(file_path) for pattern in exclude_patterns):
                continue
            
            try:
                note = self.parse_note(file_path)
                if note:
                    notes.append(note)
            except Exception as e:
                logger.error(f"Error parsing {file_path}: {e}")
                continue
        
        logger.info(f"Successfully parsed {len(notes)} notes")
        return notes
    
    def parse_note(self, file_path: Path) -> Optional[Note]:
        """
        Parse a single markdown file
        
        Args:
            file_path: Path to markdown file
        
        Returns:
            Note object or None if parsing fails
        """
        try:
            # Read file content
            content = file_path.read_text(encoding='utf-8')
            
            # Skip empty files
            if not content.strip():
                return None
            
            # Extract title (use filename without extension)
            title = file_path.stem
            # Clean up title (remove "Notes - " prefix if present)
            if title.startswith("Notes - "):
                title = title[8:]
            
            # Extract metadata from file path
            relative_path = file_path.relative_to(self.vault_path)
            category = self._extract_category(relative_path)
            book = self._extract_book(relative_path)
            
            # Extract Obsidian links
            links = self._extract_links(content)
            
            # Count words
            word_count = len(content.split())
            
            # Generate unique ID
            note_id = self._generate_id(category, book, title)
            
            return Note(
                id=note_id,
                title=title,
                content=content,
                category=category,
                book=book,
                file_path=str(relative_path),
                links=links,
                word_count=word_count,
                created_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Failed to parse {file_path}: {e}")
            return None
    
    def _extract_category(self, relative_path: Path) -> str:
        """
        Extract category from file path
        Categories are top-level folders (Spiritual, Self-Help, etc.)
        
        Args:
            relative_path: Path relative to vault root
        
        Returns:
            Category name
        """
        parts = relative_path.parts
        if len(parts) > 0:
            return parts[0]
        return "General"
    
    def _extract_book(self, relative_path: Path) -> Optional[str]:
        """
        Extract book/source name from file path
        Books are typically second-level folders
        
        Args:
            relative_path: Path relative to vault root
        
        Returns:
            Book name or None
        """
        parts = relative_path.parts
        if len(parts) >= 2:
            # Return second level (book folder name)
            return parts[1]
        return None
    
    def _extract_links(self, content: str) -> List[str]:
        """
        Extract Obsidian wiki-style links [[Link Text]]
        
        Args:
            content: Markdown content
        
        Returns:
            List of link texts
        """
        # Pattern for [[Link]] or [[Link|Display Text]]
        pattern = r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]'
        matches = re.findall(pattern, content)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_links = []
        for link in matches:
            if link not in seen:
                seen.add(link)
                unique_links.append(link)
        
        return unique_links
    
    def _generate_id(self, category: str, book: Optional[str], title: str) -> str:
        """
        Generate a unique ID for a note
        
        Args:
            category: Category name
            book: Book name (optional)
            title: Note title
        
        Returns:
            Unique identifier string
        """
        # Create slug from category, book, and title
        parts = [
            self._slugify(category),
            self._slugify(book) if book else "",
            self._slugify(title)
        ]
        slug = "_".join(p for p in parts if p)
        
        # If slug is too long, hash it
        if len(slug) > 100:
            hash_suffix = hashlib.md5(slug.encode()).hexdigest()[:8]
            slug = f"{slug[:80]}_{hash_suffix}"
        
        return slug
    
    @staticmethod
    def _slugify(text: str) -> str:
        """
        Convert text to URL-safe slug
        
        Args:
            text: Input text
        
        Returns:
            Slugified text
        """
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Replace spaces and special characters with hyphens
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        
        # Remove leading/trailing hyphens
        text = text.strip('-')
        
        return text
    
    def get_statistics(self, notes: List[Note]) -> dict:
        """
        Get statistics about parsed notes
        
        Args:
            notes: List of Note objects
        
        Returns:
            Dictionary with statistics
        """
        if not notes:
            return {
                "total_notes": 0,
                "categories": {},
                "books": {},
                "total_words": 0
            }
        
        categories = {}
        books = {}
        total_words = 0
        
        for note in notes:
            # Count by category
            categories[note.category] = categories.get(note.category, 0) + 1
            
            # Count by book
            if note.book:
                books[note.book] = books.get(note.book, 0) + 1
            
            # Total words
            total_words += note.word_count
        
        return {
            "total_notes": len(notes),
            "categories": dict(sorted(categories.items())),
            "books": dict(sorted(books.items())),
            "total_words": total_words,
            "avg_words_per_note": total_words // len(notes) if notes else 0
        }


def parse_vault(vault_path: str) -> Tuple[List[Note], dict]:
    """
    Convenience function to parse entire vault and return notes with stats
    
    Args:
        vault_path: Path to Obsidian vault
    
    Returns:
        Tuple of (notes list, statistics dict)
    """
    parser = ObsidianParser(vault_path)
    notes = parser.parse_all_notes()
    stats = parser.get_statistics(notes)
    
    return notes, stats


if __name__ == "__main__":
    # Test parsing
    import sys
    
    if len(sys.argv) > 1:
        vault_path = sys.argv[1]
    else:
        vault_path = "/Users/francescocavina/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Books"
    
    print(f"Parsing vault: {vault_path}")
    notes, stats = parse_vault(vault_path)
    
    print(f"\n=== Statistics ===")
    print(f"Total notes: {stats['total_notes']}")
    print(f"Total words: {stats['total_words']:,}")
    print(f"Average words per note: {stats['avg_words_per_note']}")
    
    print(f"\n=== Categories ===")
    for category, count in stats['categories'].items():
        print(f"  {category}: {count} notes")
    
    print(f"\n=== Sample Notes ===")
    for note in notes[:5]:
        print(f"\nTitle: {note.title}")
        print(f"Category: {note.category} / {note.book}")
        print(f"Links: {len(note.links)}")
        print(f"Content preview: {note.content[:100]}...")

