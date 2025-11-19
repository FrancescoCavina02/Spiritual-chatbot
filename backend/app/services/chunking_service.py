"""
Text Chunking Service
Implements semantic chunking strategy for notes
"""

import re
from typing import List
import logging

from app.models.note import Note, Chunk

logger = logging.getLogger(__name__)


class ChunkingService:
    """Service for splitting notes into semantic chunks"""
    
    def __init__(
        self,
        chunk_size: int = 800,
        chunk_overlap: int = 150,
        min_chunk_size: int = 100
    ):
        """
        Initialize chunking service
        
        Args:
            chunk_size: Target chunk size in tokens (approximate)
            chunk_overlap: Overlap between chunks in tokens
            min_chunk_size: Minimum chunk size to avoid tiny fragments
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        
        # Approximate tokens as words * 1.3 (rough heuristic)
        self.words_per_chunk = int(chunk_size / 1.3)
        self.overlap_words = int(chunk_overlap / 1.3)
        self.min_words = int(min_chunk_size / 1.3)
    
    def chunk_note(self, note: Note) -> List[Chunk]:
        """
        Chunk a single note into smaller pieces
        
        Args:
            note: Note object to chunk
        
        Returns:
            List of Chunk objects
        """
        content = note.content.strip()
        
        # If content is short enough, treat as single chunk
        word_count = len(content.split())
        if word_count <= self.words_per_chunk:
            return [self._create_chunk(note, content, 0, 1)]
        
        # Try semantic chunking
        chunks_text = self._semantic_chunk(content)
        
        # Create Chunk objects
        chunks = []
        total_chunks = len(chunks_text)
        
        for i, chunk_text in enumerate(chunks_text):
            chunk = self._create_chunk(note, chunk_text, i, total_chunks)
            chunks.append(chunk)
        
        return chunks
    
    def chunk_notes(self, notes: List[Note]) -> List[Chunk]:
        """
        Chunk multiple notes
        
        Args:
            notes: List of Note objects
        
        Returns:
            List of all chunks from all notes
        """
        all_chunks = []
        
        for note in notes:
            try:
                chunks = self.chunk_note(note)
                all_chunks.extend(chunks)
            except Exception as e:
                logger.error(f"Error chunking note {note.id}: {e}")
                continue
        
        logger.info(f"Created {len(all_chunks)} chunks from {len(notes)} notes")
        return all_chunks
    
    def _semantic_chunk(self, content: str) -> List[str]:
        """
        Perform semantic chunking based on structure
        
        Strategy:
        1. Split by headers (# Header, ## Subheader)
        2. If sections are too large, split by paragraphs
        3. Add overlap between chunks
        
        Args:
            content: Text content to chunk
        
        Returns:
            List of chunk texts
        """
        # Split by headers first
        sections = self._split_by_headers(content)
        
        chunks = []
        
        for section in sections:
            section_words = len(section.split())
            
            if section_words <= self.words_per_chunk:
                # Section is small enough
                if section_words >= self.min_words:
                    chunks.append(section)
            else:
                # Section is too large, split by paragraphs
                para_chunks = self._split_by_paragraphs(section)
                chunks.extend(para_chunks)
        
        # Add overlap
        chunks = self._add_overlap(chunks)
        
        return chunks
    
    def _split_by_headers(self, content: str) -> List[str]:
        """Split content by markdown headers"""
        # Pattern for headers: # Header or ## Subheader
        header_pattern = r'^#{1,6}\s+.+$'
        
        lines = content.split('\n')
        sections = []
        current_section = []
        
        for line in lines:
            if re.match(header_pattern, line):
                # Start new section
                if current_section:
                    sections.append('\n'.join(current_section).strip())
                current_section = [line]
            else:
                current_section.append(line)
        
        # Add last section
        if current_section:
            sections.append('\n'.join(current_section).strip())
        
        # If no headers found, return original content
        if len(sections) <= 1:
            return [content]
        
        return sections
    
    def _split_by_paragraphs(self, content: str) -> List[str]:
        """
        Split content by paragraphs when sections are too large
        
        Args:
            content: Text to split
        
        Returns:
            List of chunk texts
        """
        # Split by double newlines (paragraphs)
        paragraphs = re.split(r'\n\n+', content)
        
        chunks = []
        current_chunk = []
        current_words = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            para_words = len(para.split())
            
            if current_words + para_words > self.words_per_chunk:
                # Save current chunk
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                current_chunk = [para]
                current_words = para_words
            else:
                current_chunk.append(para)
                current_words += para_words
        
        # Add remaining chunk
        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            if len(chunk_text.split()) >= self.min_words:
                chunks.append(chunk_text)
        
        return chunks if chunks else [content]
    
    def _add_overlap(self, chunks: List[str]) -> List[str]:
        """
        Add overlap between consecutive chunks for context continuity
        
        Args:
            chunks: List of chunk texts
        
        Returns:
            List of chunks with overlap
        """
        if len(chunks) <= 1:
            return chunks
        
        overlapped_chunks = []
        
        for i, chunk in enumerate(chunks):
            if i == 0:
                # First chunk - no prefix overlap
                overlapped_chunks.append(chunk)
            else:
                # Add overlap from previous chunk
                prev_chunk = chunks[i - 1]
                prev_words = prev_chunk.split()
                
                if len(prev_words) > self.overlap_words:
                    # Get last N words from previous chunk
                    overlap = ' '.join(prev_words[-self.overlap_words:])
                    overlapped_chunk = f"{overlap} ... {chunk}"
                else:
                    overlapped_chunk = chunk
                
                overlapped_chunks.append(overlapped_chunk)
        
        return overlapped_chunks
    
    def _create_chunk(
        self,
        note: Note,
        text: str,
        index: int,
        total: int
    ) -> Chunk:
        """
        Create a Chunk object from text and note metadata
        
        Args:
            note: Parent note
            text: Chunk text
            index: Chunk index
            total: Total chunks for this note
        
        Returns:
            Chunk object
        """
        chunk_id = f"{note.id}_chunk_{index}"
        
        return Chunk(
            id=chunk_id,
            note_id=note.id,
            text=text.strip(),
            chunk_index=index,
            total_chunks=total,
            title=note.title,
            category=note.category,
            book=note.book,
            file_path=note.file_path,
            links=note.links
        )


if __name__ == "__main__":
    # Test chunking
    from app.models.note import Note
    
    # Create a test note
    test_note = Note(
        id="test_note",
        title="Test Note",
        content="""# Introduction

This is a test note with multiple paragraphs.

It has some content that will be chunked.

## Section 1

This is section 1 with more content. It talks about various topics related to spirituality and consciousness. The content here is meant to demonstrate how the chunking algorithm works.

When we think about consciousness, we must consider many aspects. The nature of awareness, the role of thoughts, and the experience of being present in the moment.

## Section 2

This is section 2. It continues with more spiritual wisdom and guidance. The journey of self-discovery is one that requires patience and dedication.

Remember that every moment is an opportunity for growth and transformation.
""",
        category="Test",
        book="Test Book",
        file_path="test/test_note.md",
        links=["[[Other Note]]"],
        word_count=100
    )
    
    # Chunk it
    chunker = ChunkingService(chunk_size=400, chunk_overlap=50)
    chunks = chunker.chunk_note(test_note)
    
    print(f"Created {len(chunks)} chunks from test note:\n")
    for i, chunk in enumerate(chunks):
        print(f"--- Chunk {i + 1} ---")
        print(f"Words: {len(chunk.text.split())}")
        print(f"Preview: {chunk.text[:200]}...")
        print()

