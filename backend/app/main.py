"""
Spiritual AI Guide — FastAPI Backend
RAG-powered spiritual guidance chatbot API

Retrieves semantically relevant context from 1,649 personal notes
(~300K words, 1,772 chunks in ChromaDB) and generates cited responses
via OpenAI GPT-4 Turbo or Ollama Llama 3.1 as a local backup.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import logging
import os
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.api import search, notes, chat, tree
from app.models.api import HealthResponse, StatsResponse
from app.services.vector_db import get_vector_db
from app.services.embedding_service import get_embedding_service
from app.services.llm_service import get_llm_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Record startup timestamp for uptime tracking
_startup_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events"""
    global _startup_time
    _startup_time = time.time()

    logger.info("=" * 60)
    logger.info("Spiritual AI Guide API — starting up")
    logger.info("=" * 60)

    try:
        # Initialize vector database
        vector_db = get_vector_db()
        chunk_count = vector_db.collection.count()
        logger.info(f"✓ ChromaDB ready: {chunk_count:,} chunks indexed")

        # Initialize embedding service
        embedding_service = get_embedding_service()
        logger.info(
            f"✓ Embedding model: {embedding_service.model_name} "
            f"({embedding_service.embedding_dim}D vectors)"
        )

        # Initialize LLM service
        llm_service = get_llm_service()
        available_llms = llm_service.get_available_providers()
        if available_llms:
            logger.info(f"✓ LLM providers available: {', '.join(available_llms)}")
        else:
            logger.warning("⚠  No LLM providers available — chat will not function")

        # Log API key presence without exposing values
        openai_key_present = bool(os.getenv("OPENAI_API_KEY"))
        logger.info(f"✓ OPENAI_API_KEY present: {openai_key_present}")

        # Initialize tree structures
        tree.initialize_trees()
        logger.info("✓ Note tree structures initialized")

    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        logger.warning("API starting with limited functionality")

    logger.info("API ready to accept requests")
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("Shutting down Spiritual AI Guide API")


# CORS origins — read from environment for production flexibility
_cors_origins_env = os.getenv("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _cors_origins_env.split(",") if o.strip()] if _cors_origins_env else []

# Always allow localhost for development
_default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    # TODO: Replace [LIVE_URL] with your production Vercel URL, e.g.:
    # "https://spiritual-ai-guide.vercel.app",
]

_allowed_origins = list(set(_default_origins + _cors_origins))


# Create FastAPI application
app = FastAPI(
    title="Spiritual AI Guide — RAG Chatbot API",
    description=(
        "A Retrieval-Augmented Generation (RAG) API that semantically searches "
        "1,649 personal Obsidian notes (~300K words, 1,772 ChromaDB chunks) and "
        "generates spiritually-grounded responses with precise source citations. "
        "Supports OpenAI GPT-4 Turbo, Ollama Llama 3.1, Anthropic Claude, and "
        "Google Gemini as interchangeable LLM backends.\n\n"
        "**RAG Pipeline:** Obsidian Vault → Semantic Chunking → "
        "all-MiniLM-L6-v2 Embeddings (384D) → ChromaDB → "
        "Hybrid BM25 + Dense Retrieval → Re-ranking → LLM Generation with citations.\n\n"
        "**Author:** Francesco Cavina"
    ),
    version="1.0.0",
    contact={
        "name": "Francesco Cavina",
        "url": "https://github.com/FrancescoCavina02/Spiritual-chatbot",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(notes.router)
app.include_router(tree.router)


@app.get("/", tags=["meta"], summary="API root")
async def root():
    """Root endpoint — confirms the API is running."""
    return {
        "service": "Spiritual AI Guide Chatbot API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/health",
        "github": "https://github.com/FrancescoCavina02/Spiritual-chatbot",
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["meta"],
    summary="Health check",
    description=(
        "Returns live status of all backend services: ChromaDB vector store, "
        "embedding model, and available LLM providers. Suitable for uptime monitors."
    ),
)
async def health_check():
    """
    Comprehensive health check endpoint.

    Returns the status of each dependent service and overall uptime.
    Used by Railway health checks and frontend connection validation.
    """
    uptime_seconds = int(time.time() - _startup_time)
    services: dict = {
        "api": "operational",
        "chromadb": "unknown",
        "embeddings": "unknown",
        "llm": "unknown",
    }

    try:
        # ChromaDB status
        vector_db = get_vector_db()
        chunk_count = vector_db.collection.count()
        services["chromadb"] = f"operational ({chunk_count:,} chunks indexed)"

        # Embedding service status
        embedding_service = get_embedding_service()
        services["embeddings"] = (
            f"operational ({embedding_service.model_name}, "
            f"{embedding_service.embedding_dim}D)"
        )

        # LLM service status
        llm_service = get_llm_service()
        available_llms = llm_service.get_available_providers()
        services["llm"] = (
            f"{len(available_llms)} provider(s) active: {', '.join(available_llms)}"
            if available_llms
            else "no providers available"
        )

    except Exception as e:
        logger.error(f"Health check error: {e}")

    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
        services={**services, "uptime_seconds": uptime_seconds},
    )


@app.get(
    "/stats",
    response_model=StatsResponse,
    tags=["meta"],
    summary="Knowledge base statistics",
    description=(
        "Returns aggregate statistics about the indexed knowledge base: "
        "total chunks, note count, category breakdown, top books, "
        "and the embedding model in use."
    ),
)
async def get_stats():
    """
    Knowledge base statistics.

    Provides a breakdown of indexed content by category and book,
    useful for understanding the breadth of the knowledge base.
    """
    try:
        vector_db = get_vector_db()
        embedding_service = get_embedding_service()

        db_stats = vector_db.get_statistics()

        return StatsResponse(
            total_chunks=db_stats["total_chunks"],
            total_notes=db_stats.get("notes_sampled", 0),
            categories=db_stats["categories"],
            books=db_stats["books"],
            embedding_model=embedding_service.model_name,
            vector_db_size=db_stats["total_chunks"],
        )

    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
