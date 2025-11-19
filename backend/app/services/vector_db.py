"""
ChromaDB Vector Database Service
Handles storage and retrieval of note chunks with embeddings
"""

import chromadb
from chromadb.config import Settings
from typing import List, Optional, Dict, Any
import logging
from pathlib import Path

from app.models.note import Chunk

logger = logging.getLogger(__name__)


class VectorDBService:
    """Service for managing ChromaDB vector database"""
    
    def __init__(
        self,
        persist_directory: str = "../data/embeddings",
        collection_name: str = "spiritual_notes"
    ):
        """
        Initialize vector database service
        
        Args:
            persist_directory: Directory to persist ChromaDB data
            collection_name: Name of the collection to use
        """
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        
        self.collection_name = collection_name
        
        logger.info(f"Initializing ChromaDB at {self.persist_directory}")
        
        try:
            # Initialize ChromaDB client with persistence
            self.client = chromadb.PersistentClient(
                path=str(self.persist_directory),
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            
            logger.info(f"ChromaDB initialized. Collection: {self.collection_name}")
            logger.info(f"Current collection size: {self.collection.count()} chunks")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise
    
    def add_chunks(self, chunks: List[Chunk], batch_size: int = 100) -> int:
        """
        Add chunks to the vector database
        
        Args:
            chunks: List of Chunk objects with embeddings
            batch_size: Number of chunks to add per batch
        
        Returns:
            Number of chunks added
        """
        if not chunks:
            return 0
        
        # Verify all chunks have embeddings
        chunks_with_embeddings = [c for c in chunks if c.embedding is not None]
        
        if len(chunks_with_embeddings) < len(chunks):
            logger.warning(
                f"{len(chunks) - len(chunks_with_embeddings)} chunks missing embeddings"
            )
        
        logger.info(f"Adding {len(chunks_with_embeddings)} chunks to ChromaDB...")
        
        # Add in batches
        added_count = 0
        
        for i in range(0, len(chunks_with_embeddings), batch_size):
            batch = chunks_with_embeddings[i:i + batch_size]
            
            try:
                self.collection.add(
                    ids=[chunk.id for chunk in batch],
                    embeddings=[chunk.embedding for chunk in batch],
                    documents=[chunk.text for chunk in batch],
                    metadatas=[
                        {
                            "note_id": chunk.note_id,
                            "title": chunk.title,
                            "category": chunk.category,
                            "book": chunk.book if chunk.book else "",
                            "file_path": chunk.file_path,
                            "chunk_index": chunk.chunk_index,
                            "total_chunks": chunk.total_chunks,
                            "links": str(chunk.links)  # Convert list to string
                        }
                        for chunk in batch
                    ]
                )
                
                added_count += len(batch)
                
                if (i + batch_size) % 500 == 0:
                    logger.info(f"  Progress: {added_count}/{len(chunks_with_embeddings)}")
            
            except Exception as e:
                logger.error(f"Error adding batch {i//batch_size}: {e}")
                continue
        
        logger.info(f"✓ Successfully added {added_count} chunks")
        return added_count
    
    def query(
        self,
        query_embedding: List[float],
        n_results: int = 10,
        category_filter: Optional[str] = None,
        book_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query the vector database
        
        Args:
            query_embedding: Query vector embedding
            n_results: Number of results to return
            category_filter: Filter by category (optional)
            book_filter: Filter by book (optional)
        
        Returns:
            Dictionary with query results
        """
        try:
            # Build where clause for filtering
            where = None
            if category_filter or book_filter:
                where = {}
                if category_filter:
                    where["category"] = category_filter
                if book_filter:
                    where["book"] = book_filter
            
            # Query ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where,
                include=["documents", "metadatas", "distances"]
            )
            
            return results
        
        except Exception as e:
            logger.error(f"Error querying ChromaDB: {e}")
            raise
    
    def query_with_text(
        self,
        query_text: str,
        n_results: int = 10,
        category_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query using raw text (ChromaDB will embed it)
        
        Args:
            query_text: Query text
            n_results: Number of results to return
            category_filter: Filter by category (optional)
        
        Returns:
            Dictionary with query results
        """
        try:
            where = {"category": category_filter} if category_filter else None
            
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n_results,
                where=where,
                include=["documents", "metadatas", "distances"]
            )
            
            return results
        
        except Exception as e:
            logger.error(f"Error querying ChromaDB with text: {e}")
            raise
    
    def get_by_id(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific chunk by ID
        
        Args:
            chunk_id: Chunk identifier
        
        Returns:
            Chunk data or None if not found
        """
        try:
            result = self.collection.get(
                ids=[chunk_id],
                include=["documents", "metadatas", "embeddings"]
            )
            
            if result['ids']:
                return {
                    "id": result['ids'][0],
                    "document": result['documents'][0],
                    "metadata": result['metadatas'][0],
                    "embedding": result['embeddings'][0] if 'embeddings' in result else None
                }
            return None
        
        except Exception as e:
            logger.error(f"Error getting chunk {chunk_id}: {e}")
            return None
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get database statistics
        
        Returns:
            Dictionary with statistics
        """
        total_chunks = self.collection.count()
        
        # Get all metadata to compute stats
        if total_chunks == 0:
            return {
                "total_chunks": 0,
                "categories": {},
                "books": {},
                "notes": 0
            }
        
        # Get ALL metadata (not just a sample) to ensure accurate stats
        sample = self.collection.get(
            limit=total_chunks,  # Get ALL chunks, not just 1000
            include=["metadatas"]
        )
        
        categories = {}
        books = {}
        note_ids = set()
        
        for metadata in sample['metadatas']:
            # Count categories
            cat = metadata.get('category', 'Unknown')
            categories[cat] = categories.get(cat, 0) + 1
            
            # Count books
            book = metadata.get('book', '')
            if book:
                books[book] = books.get(book, 0) + 1
            
            # Count unique notes
            note_id = metadata.get('note_id', '')
            if note_id:
                note_ids.add(note_id)
        
        return {
            "total_chunks": total_chunks,
            "categories": dict(sorted(categories.items())),
            "books": dict(sorted(books.items())),
            "notes_sampled": len(note_ids)
        }
    
    def reset_collection(self):
        """Reset (delete) the collection"""
        logger.warning(f"Resetting collection: {self.collection_name}")
        self.client.delete_collection(name=self.collection_name)
        
        # Recreate collection
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        logger.info("Collection reset complete")


# Global vector DB instance
_vector_db: Optional[VectorDBService] = None


def get_vector_db(
    persist_directory: str = "../data/embeddings"
) -> VectorDBService:
    """
    Get or create the global vector database instance
    
    Args:
        persist_directory: Directory to persist ChromaDB data
    
    Returns:
        VectorDBService instance
    """
    global _vector_db
    
    if _vector_db is None:
        _vector_db = VectorDBService(persist_directory=persist_directory)
    
    return _vector_db


if __name__ == "__main__":
    # Test ChromaDB service
    import numpy as np
    
    # Initialize service
    db = VectorDBService(persist_directory="../data/test_embeddings")
    
    print("=== ChromaDB Service Test ===\n")
    
    # Create test chunks
    print("Creating test chunks...")
    
    test_chunks = [
        Chunk(
            id="test_1",
            note_id="test_note_1",
            text="The present moment is all we have. Live in the now.",
            chunk_index=0,
            total_chunks=1,
            title="Living in the Present",
            category="Spiritual",
            book="The Power of Now",
            file_path="Spiritual/Power of Now/present.md",
            links=[],
            embedding=np.random.rand(384).tolist()
        ),
        Chunk(
            id="test_2",
            note_id="test_note_2",
            text="Meditation helps cultivate inner peace and awareness.",
            chunk_index=0,
            total_chunks=1,
            title="Meditation Practice",
            category="Spiritual",
            book="Mindfulness Guide",
            file_path="Spiritual/Mindfulness/meditation.md",
            links=[],
            embedding=np.random.rand(384).tolist()
        )
    ]
    
    # Add chunks
    added = db.add_chunks(test_chunks)
    print(f"✓ Added {added} test chunks\n")
    
    # Get statistics
    print("=== Statistics ===")
    stats = db.get_statistics()
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    # Query
    print("\n=== Query Test ===")
    query_emb = np.random.rand(384).tolist()
    results = db.query(query_emb, n_results=2)
    
    print(f"Found {len(results['ids'][0])} results:")
    for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
        print(f"\n{i+1}. {metadata['title']} ({metadata['category']})")
        print(f"   {doc[:100]}...")
    
    # Clean up
    print("\n=== Cleanup ===")
    db.reset_collection()
    print("Test complete!")

