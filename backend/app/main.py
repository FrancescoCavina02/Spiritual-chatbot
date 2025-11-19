"""
Spiritual AI Guide Chatbot - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from app.api import search, notes, chat
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting Spiritual AI Guide Chatbot API...")
    logger.info("Initializing services...")
    
    try:
        # Initialize services
        vector_db = get_vector_db()
        embedding_service = get_embedding_service()
        llm_service = get_llm_service()
        
        logger.info(f"✓ Vector DB initialized: {vector_db.collection.count()} chunks")
        logger.info(f"✓ Embedding service ready: {embedding_service.embedding_dim}D vectors")
        
        available_llms = llm_service.get_available_providers()
        if available_llms:
            logger.info(f"✓ LLM providers available: {', '.join(available_llms)}")
        else:
            logger.warning("⚠ No LLM providers available - chat will not work")
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        logger.warning("API starting with limited functionality")
    
    logger.info("API ready to accept requests")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API...")


# Create FastAPI app
app = FastAPI(
    title="Spiritual AI Guide Chatbot API",
    description="RAG-powered chatbot for spiritual and psychological guidance",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(notes.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Spiritual AI Guide Chatbot API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    services = {
        "api": "operational",
        "chromadb": "unknown",
        "embeddings": "unknown",
        "llm": "unknown"
    }
    
    try:
        # Check ChromaDB
        vector_db = get_vector_db()
        chunk_count = vector_db.collection.count()
        services["chromadb"] = "operational" if chunk_count > 0 else "empty"
        
        # Check embedding service
        embedding_service = get_embedding_service()
        services["embeddings"] = "operational"
        
        # Check LLM service
        llm_service = get_llm_service()
        available_llms = llm_service.get_available_providers()
        services["llm"] = f"{len(available_llms)} providers" if available_llms else "none"
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        services=services
    )


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Get system statistics"""
    try:
        vector_db = get_vector_db()
        embedding_service = get_embedding_service()
        
        db_stats = vector_db.get_statistics()
        
        return StatsResponse(
            total_chunks=db_stats['total_chunks'],
            total_notes=db_stats.get('notes_sampled', 0),
            categories=db_stats['categories'],
            books=db_stats['books'],
            embedding_model=embedding_service.model_name,
            vector_db_size=db_stats['total_chunks']
        )
    
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

