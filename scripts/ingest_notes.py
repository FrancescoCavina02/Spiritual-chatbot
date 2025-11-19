"""
Main Data Ingestion Script
Parse Obsidian vault, chunk notes, and generate embeddings
"""

import json
import sys
from pathlib import Path
import logging
from typing import List

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.services.obsidian_parser import parse_vault
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.models.note import Chunk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def save_chunks(chunks: List[Chunk], output_file: Path):
    """Save chunks to JSON file"""
    chunks_data = []
    for chunk in chunks:
        chunk_dict = chunk.model_dump()
        chunks_data.append(chunk_dict)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(chunks_data, f, indent=2, ensure_ascii=False, default=str)
    
    logger.info(f"Saved {len(chunks)} chunks to {output_file}")


def main():
    """Main ingestion pipeline"""
    
    # Configuration
    VAULT_PATH = "/Users/francescocavina/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Books"
    DATA_DIR = Path(__file__).parent.parent / "data"
    PROCESSED_DIR = DATA_DIR / "processed"
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    
    logger.info("="*60)
    logger.info("SPIRITUAL AI GUIDE - DATA INGESTION PIPELINE")
    logger.info("="*60)
    
    # Step 1: Parse Obsidian Vault
    logger.info("\n[1/4] Parsing Obsidian vault...")
    notes, stats = parse_vault(VAULT_PATH)
    
    logger.info(f"✓ Parsed {stats['total_notes']} notes")
    logger.info(f"  Total words: {stats['total_words']:,}")
    logger.info(f"  Categories: {len(stats['categories'])}")
    
    # Save notes
    notes_file = PROCESSED_DIR / "notes.json"
    notes_data = [note.model_dump() for note in notes]
    with open(notes_file, 'w', encoding='utf-8') as f:
        json.dump(notes_data, f, indent=2, ensure_ascii=False, default=str)
    logger.info(f"✓ Saved notes to {notes_file}")
    
    # Save statistics
    stats_file = PROCESSED_DIR / "statistics.json"
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    
    # Step 2: Chunk Notes
    logger.info("\n[2/4] Chunking notes...")
    chunker = ChunkingService(
        chunk_size=800,
        chunk_overlap=150,
        min_chunk_size=100
    )
    
    chunks = chunker.chunk_notes(notes)
    logger.info(f"✓ Created {len(chunks)} chunks")
    logger.info(f"  Average chunks per note: {len(chunks) / len(notes):.1f}")
    
    # Step 3: Generate Embeddings
    logger.info("\n[3/4] Generating embeddings...")
    logger.info("  This may take a few minutes...")
    
    embedding_service = EmbeddingService(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        batch_size=32
    )
    
    # Print model info
    model_info = embedding_service.get_model_info()
    logger.info(f"  Model: {model_info['model_name']}")
    logger.info(f"  Embedding dimension: {model_info['embedding_dimension']}")
    logger.info(f"  Device: {model_info['device']}")
    
    # Generate embeddings
    chunks = embedding_service.embed_chunks(chunks, show_progress=True)
    logger.info(f"✓ Generated {len(chunks)} embeddings")
    
    # Step 4: Save Chunks with Embeddings
    logger.info("\n[4/4] Saving chunks with embeddings...")
    chunks_file = PROCESSED_DIR / "chunks_with_embeddings.json"
    save_chunks(chunks, chunks_file)
    
    # Generate summary
    logger.info("\n" + "="*60)
    logger.info("INGESTION COMPLETE")
    logger.info("="*60)
    logger.info(f"Notes:      {len(notes):,}")
    logger.info(f"Chunks:     {len(chunks):,}")
    logger.info(f"Categories: {len(stats['categories'])}")
    logger.info(f"Total words: {stats['total_words']:,}")
    
    logger.info(f"\nFiles saved to: {PROCESSED_DIR}")
    logger.info(f"  - notes.json ({notes_file.stat().st_size / 1024 / 1024:.1f} MB)")
    logger.info(f"  - chunks_with_embeddings.json ({chunks_file.stat().st_size / 1024 / 1024:.1f} MB)")
    logger.info(f"  - statistics.json")
    
    logger.info("\nNext step: Load chunks into ChromaDB vector store")
    logger.info("Run: python scripts/load_chromadb.py")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\nIngestion interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\nIngestion failed: {e}", exc_info=True)
        sys.exit(1)

