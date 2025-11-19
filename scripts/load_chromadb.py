"""
Load Chunks into ChromaDB
Reads processed chunks with embeddings and loads them into ChromaDB
"""

import json
import sys
from pathlib import Path
import logging

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.services.vector_db import VectorDBService
from app.models.note import Chunk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_chunks_from_json(file_path: Path) -> list[Chunk]:
    """Load chunks from JSON file"""
    logger.info(f"Loading chunks from {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        chunks_data = json.load(f)
    
    chunks = [Chunk(**chunk_data) for chunk_data in chunks_data]
    
    logger.info(f"✓ Loaded {len(chunks)} chunks")
    return chunks


def main():
    """Main function to load chunks into ChromaDB"""
    
    # Configuration
    DATA_DIR = Path(__file__).parent.parent / "data"
    CHUNKS_FILE = DATA_DIR / "processed" / "chunks_with_embeddings.json"
    EMBEDDINGS_DIR = DATA_DIR / "embeddings"
    
    logger.info("="*60)
    logger.info("LOADING CHUNKS INTO CHROMADB")
    logger.info("="*60)
    
    # Check if chunks file exists
    if not CHUNKS_FILE.exists():
        logger.error(f"Chunks file not found: {CHUNKS_FILE}")
        logger.error("Please run 'python scripts/ingest_notes.py' first")
        sys.exit(1)
    
    # Step 1: Load chunks from JSON
    logger.info("\n[1/3] Loading chunks from JSON...")
    chunks = load_chunks_from_json(CHUNKS_FILE)
    
    # Verify embeddings
    chunks_with_embeddings = [c for c in chunks if c.embedding is not None]
    logger.info(f"  Chunks with embeddings: {len(chunks_with_embeddings)}/{len(chunks)}")
    
    if len(chunks_with_embeddings) == 0:
        logger.error("No chunks have embeddings!")
        sys.exit(1)
    
    # Step 2: Initialize ChromaDB
    logger.info("\n[2/3] Initializing ChromaDB...")
    db = VectorDBService(persist_directory=str(EMBEDDINGS_DIR))
    
    # Check if collection is empty
    current_count = db.collection.count()
    if current_count > 0:
        logger.warning(f"Collection already has {current_count} chunks")
        response = input("Do you want to reset and reload? (yes/no): ")
        
        if response.lower() in ['yes', 'y']:
            db.reset_collection()
            logger.info("✓ Collection reset")
        else:
            logger.info("Skipping reset, will add to existing collection")
    
    # Step 3: Add chunks to ChromaDB
    logger.info("\n[3/3] Adding chunks to ChromaDB...")
    added_count = db.add_chunks(chunks_with_embeddings, batch_size=100)
    
    # Get statistics
    logger.info("\n" + "="*60)
    logger.info("LOADING COMPLETE")
    logger.info("="*60)
    
    stats = db.get_statistics()
    logger.info(f"Total chunks in database: {stats['total_chunks']:,}")
    logger.info(f"Categories: {len(stats['categories'])}")
    logger.info(f"Books: {len(stats['books'])}")
    
    logger.info("\nTop 5 categories:")
    sorted_cats = sorted(stats['categories'].items(), key=lambda x: x[1], reverse=True)
    for cat, count in sorted_cats[:5]:
        logger.info(f"  - {cat}: {count} chunks")
    
    logger.info("\nChromaDB ready for queries!")
    logger.info("You can now start the FastAPI server to use the RAG system.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\nLoading interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\nLoading failed: {e}", exc_info=True)
        sys.exit(1)

