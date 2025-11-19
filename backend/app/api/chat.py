"""Chat API endpoints"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import time
import logging
import uuid
from typing import AsyncGenerator

from app.models.api import ChatRequest, ChatResponse
from app.services.rag_engine import get_rag_engine
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint with RAG-powered responses
    
    Returns AI response with citations from knowledge base
    """
    start_time = time.time()
    
    try:
        # Get services
        rag_engine = get_rag_engine()
        llm_service = get_llm_service()
        
        # Get provider (support backward compatibility with 'model' field)
        provider_to_use = request.provider or request.model or "openai"
        
        # Check if requested provider is available
        if not llm_service.is_available(provider_to_use):
            available = llm_service.get_available_providers()
            if not available:
                raise HTTPException(
                    status_code=503,
                    detail="No LLM providers available. Please check Ollama is running or API keys are configured."
                )
            # Use first available provider
            logger.warning(f"Provider '{provider_to_use}' not available. Available: {available}. Using {available[0]}")
            provider_to_use = available[0]
        else:
            logger.info(f"Using provider: {provider_to_use}")
        
        # Step 1: Retrieve relevant context
        context, citations = rag_engine.retrieve_context(
            query=request.message,
            category_filter=request.category_filter
        )
        
        # Step 2: Construct prompt
        prompt = rag_engine.construct_prompt(
            query=request.message,
            context=context,
            conversation_history=None  # TODO: Add conversation history support
        )
        
        # Step 3: Generate response
        response_text = await llm_service.generate(
            prompt=prompt,
            provider=provider_to_use,
            temperature=0.7,
            max_tokens=1000
        )
        
        # Step 4: Parse any additional citations from response
        cited_titles = rag_engine.parse_citations(response_text)
        
        # Generate conversation ID if not provided
        conversation_id = request.conversation_id or f"conv_{uuid.uuid4().hex[:12]}"
        
        processing_time = (time.time() - start_time) * 1000
        
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            citations=citations,
            model_used=provider_to_use,
            processing_time_ms=processing_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint
    
    Returns Server-Sent Events stream of response chunks
    """
    
    async def generate_response() -> AsyncGenerator[str, None]:
        """Generate streaming response"""
        try:
            # Get services
            rag_engine = get_rag_engine()
            llm_service = get_llm_service()
            
            # Get provider (support backward compatibility)
            provider_to_use = request.provider or request.model or "openai"
            
            # Check provider availability
            if not llm_service.is_available(provider_to_use):
                available = llm_service.get_available_providers()
                if not available:
                    yield f"data: {{'error': 'No LLM providers available'}}\n\n"
                    return
                provider_to_use = available[0]
            
            # Retrieve context
            context, citations = rag_engine.retrieve_context(
                query=request.message,
                category_filter=request.category_filter
            )
            
            # Send citations first
            import json
            citations_data = [c.model_dump() for c in citations]
            yield f"data: {json.dumps({'type': 'citations', 'data': citations_data})}\n\n"
            
            # Construct prompt
            prompt = rag_engine.construct_prompt(
                query=request.message,
                context=context
            )
            
            # Stream response
            async for chunk in llm_service.generate_stream(
                prompt=prompt,
                provider=provider_to_use,
                temperature=0.7,
                max_tokens=1000
            ):
                yield f"data: {json.dumps({'type': 'text', 'data': chunk})}\n\n"
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done', 'model': provider_to_use})}\n\n"
        
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/models")
async def get_available_models():
    """Get list of available LLM models"""
    try:
        llm_service = get_llm_service()
        providers = llm_service.get_available_providers()
        
        # Map provider names to model names
        model_info = {
            "ollama": {
                "name": "Llama 3.1 (Local)",
                "provider": "ollama",
                "available": "ollama" in providers,
                "cost": "free"
            },
            "openai": {
                "name": "GPT-4 Turbo",
                "provider": "openai",
                "available": "openai" in providers,
                "cost": "paid"
            },
            "anthropic": {
                "name": "Claude 3 Sonnet",
                "provider": "anthropic",
                "available": "anthropic" in providers,
                "cost": "paid"
            }
        }
        
        return {
            "models": model_info,
            "default": "ollama" if "ollama" in providers else (providers[0] if providers else None)
        }
    
    except Exception as e:
        logger.error(f"Error getting models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

