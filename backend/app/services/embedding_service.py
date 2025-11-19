"""
Embedding Service
Generates vector embeddings for text chunks using sentence-transformers
"""

import numpy as np
from typing import List, Optional
import logging
from sentence_transformers import SentenceTransformer

from app.models.note import Chunk

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        batch_size: int = 32,
        device: Optional[str] = None
    ):
        """
        Initialize embedding service
        
        Args:
            model_name: Sentence transformer model to use
            batch_size: Batch size for encoding
            device: Device to run model on ('cuda', 'cpu', or None for auto)
        """
        self.model_name = model_name
        self.batch_size = batch_size
        
        logger.info(f"Loading embedding model: {model_name}")
        
        try:
            self.model = SentenceTransformer(model_name, device=device)
            self.embedding_dim = self.model.get_sentence_embedding_dimension()
            logger.info(f"Model loaded successfully. Embedding dimension: {self.embedding_dim}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Text to embed
        
        Returns:
            Embedding vector as list of floats
        """
        try:
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                show_progress_bar=False
            )
            
            # Normalize for cosine similarity
            embedding = embedding / np.linalg.norm(embedding)
            
            return embedding.tolist()
        
        except Exception as e:
            logger.error(f"Error embedding text: {e}")
            raise
    
    def embed_chunks(
        self,
        chunks: List[Chunk],
        show_progress: bool = True
    ) -> List[Chunk]:
        """
        Generate embeddings for multiple chunks
        
        Args:
            chunks: List of Chunk objects
            show_progress: Whether to show progress bar
        
        Returns:
            List of Chunk objects with embeddings populated
        """
        if not chunks:
            return []
        
        logger.info(f"Generating embeddings for {len(chunks)} chunks...")
        
        # Extract texts
        texts = [chunk.text for chunk in chunks]
        
        try:
            # Generate embeddings in batches
            embeddings = self.model.encode(
                texts,
                batch_size=self.batch_size,
                show_progress_bar=show_progress,
                convert_to_numpy=True
            )
            
            # Normalize embeddings
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / norms
            
            # Add embeddings to chunks
            for i, chunk in enumerate(chunks):
                chunk.embedding = embeddings[i].tolist()
            
            logger.info(f"Successfully generated {len(chunks)} embeddings")
            return chunks
        
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
    
    def embed_batch(
        self,
        texts: List[str],
        normalize: bool = True
    ) -> np.ndarray:
        """
        Generate embeddings for a batch of texts
        
        Args:
            texts: List of text strings
            normalize: Whether to normalize embeddings
        
        Returns:
            NumPy array of embeddings
        """
        embeddings = self.model.encode(
            texts,
            batch_size=self.batch_size,
            show_progress_bar=False,
            convert_to_numpy=True
        )
        
        if normalize:
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / norms
        
        return embeddings
    
    def get_model_info(self) -> dict:
        """
        Get information about the loaded model
        
        Returns:
            Dictionary with model information
        """
        return {
            "model_name": self.model_name,
            "embedding_dimension": self.embedding_dim,
            "max_sequence_length": self.model.max_seq_length,
            "device": str(self.model.device)
        }


# Global embedding service instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service(
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
) -> EmbeddingService:
    """
    Get or create the global embedding service instance
    
    Args:
        model_name: Model to use for embeddings
    
    Returns:
        EmbeddingService instance
    """
    global _embedding_service
    
    if _embedding_service is None:
        _embedding_service = EmbeddingService(model_name=model_name)
    
    return _embedding_service


if __name__ == "__main__":
    # Test embedding service
    import time
    
    # Initialize service
    service = EmbeddingService()
    
    # Print model info
    info = service.get_model_info()
    print("=== Model Info ===")
    for key, value in info.items():
        print(f"{key}: {value}")
    
    # Test single embedding
    print("\n=== Single Text Embedding ===")
    test_text = "This is a test sentence about spirituality and consciousness."
    
    start = time.time()
    embedding = service.embed_text(test_text)
    elapsed = time.time() - start
    
    print(f"Text: {test_text}")
    print(f"Embedding dimension: {len(embedding)}")
    print(f"First 5 values: {embedding[:5]}")
    print(f"Time: {elapsed*1000:.2f}ms")
    
    # Test batch embedding
    print("\n=== Batch Embedding ===")
    test_texts = [
        "The present moment is all we have.",
        "Consciousness is the foundation of reality.",
        "Meditation helps cultivate inner peace.",
        "The ego is an illusion of separation."
    ]
    
    start = time.time()
    embeddings = service.embed_batch(test_texts)
    elapsed = time.time() - start
    
    print(f"Number of texts: {len(test_texts)}")
    print(f"Embeddings shape: {embeddings.shape}")
    print(f"Time: {elapsed*1000:.2f}ms ({elapsed*1000/len(test_texts):.2f}ms per text)")
    
    # Test similarity
    print("\n=== Similarity Test ===")
    query = "What is consciousness?"
    query_emb = service.embed_text(query)
    query_emb = np.array(query_emb)
    
    similarities = np.dot(embeddings, query_emb)
    
    print(f"Query: {query}")
    for i, (text, sim) in enumerate(zip(test_texts, similarities)):
        print(f"{i+1}. [{sim:.3f}] {text}")

