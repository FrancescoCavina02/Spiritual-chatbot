"""
LLM Service
Unified interface for multiple LLM providers (Ollama, OpenAI, Anthropic, Google)
"""

from typing import AsyncGenerator, Optional, Dict, Any
import logging
import os
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    """Base class for LLM providers"""
    
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate a complete response"""
        pass
    
    @abstractmethod
    async def generate_stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Generate a streaming response"""
        pass


class OllamaProvider(BaseLLMProvider):
    """Ollama local LLM provider"""
    
    def __init__(self, model: str = "llama3.1", base_url: str = "http://localhost:11434"):
        """
        Initialize Ollama provider
        
        Args:
            model: Model name (e.g., "llama3.1", "mistral")
            base_url: Ollama server URL
        """
        self.model = model
        self.base_url = base_url
        
        try:
            import ollama
            self.client = ollama.Client(host=base_url)
            logger.info(f"Ollama provider initialized: {model}")
        except ImportError:
            logger.error("ollama package not installed. Install with: pip install ollama")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize Ollama: {e}")
            raise
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate complete response"""
        try:
            response = self.client.generate(
                model=self.model,
                prompt=prompt,
                options={
                    "temperature": kwargs.get("temperature", 0.7),
                    "top_p": kwargs.get("top_p", 0.9),
                    "max_tokens": kwargs.get("max_tokens", 1000)
                }
            )
            return response['response']
        
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            raise
    
    async def generate_stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Generate streaming response"""
        try:
            stream = self.client.generate(
                model=self.model,
                prompt=prompt,
                stream=True,
                options={
                    "temperature": kwargs.get("temperature", 0.7),
                    "top_p": kwargs.get("top_p", 0.9),
                    "max_tokens": kwargs.get("max_tokens", 1000)
                }
            )
            
            for chunk in stream:
                if 'response' in chunk:
                    yield chunk['response']
        
        except Exception as e:
            logger.error(f"Ollama streaming error: {e}")
            raise


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API provider"""
    
    def __init__(self, model: str = "gpt-4-turbo-preview", api_key: Optional[str] = None):
        """
        Initialize OpenAI provider
        
        Args:
            model: Model name
            api_key: OpenAI API key (or from environment)
        """
        self.model = model
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError("OpenAI API key not provided")
        
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(api_key=self.api_key)
            logger.info(f"OpenAI provider initialized: {model}")
        except ImportError:
            logger.error("openai package not installed")
            raise
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate complete response"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 1000)
            )
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            raise
    
    async def generate_stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Generate streaming response"""
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=kwargs.get("temperature", 0.7),
                max_tokens=kwargs.get("max_tokens", 1000),
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            raise


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude API provider"""
    
    def __init__(self, model: str = "claude-3-sonnet-20240229", api_key: Optional[str] = None):
        """
        Initialize Anthropic provider
        
        Args:
            model: Model name
            api_key: Anthropic API key (or from environment)
        """
        self.model = model
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        
        if not self.api_key:
            raise ValueError("Anthropic API key not provided")
        
        try:
            from anthropic import AsyncAnthropic
            self.client = AsyncAnthropic(api_key=self.api_key)
            logger.info(f"Anthropic provider initialized: {model}")
        except ImportError:
            logger.error("anthropic package not installed")
            raise
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate complete response"""
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=kwargs.get("max_tokens", 1000),
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        
        except Exception as e:
            logger.error(f"Anthropic generation error: {e}")
            raise
    
    async def generate_stream(self, prompt: str, **kwargs) -> AsyncGenerator[str, None]:
        """Generate streaming response"""
        try:
            async with self.client.messages.stream(
                model=self.model,
                max_tokens=kwargs.get("max_tokens", 1000),
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        
        except Exception as e:
            logger.error(f"Anthropic streaming error: {e}")
            raise


class LLMService:
    """
    Unified LLM service supporting multiple providers
    """
    
    def __init__(self):
        """Initialize LLM service"""
        self.providers: Dict[str, BaseLLMProvider] = {}
        self.default_provider = "ollama"
        
        # Try to initialize Ollama by default
        try:
            self.providers["ollama"] = OllamaProvider(model="llama3.1")
            logger.info("✓ Ollama provider ready")
        except Exception as e:
            logger.warning(f"Ollama not available: {e}")
        
        # Try to initialize OpenAI if API key is present
        if os.getenv("OPENAI_API_KEY"):
            try:
                self.providers["openai"] = OpenAIProvider()
                logger.info("✓ OpenAI provider ready")
            except Exception as e:
                logger.warning(f"OpenAI not available: {e}")
        
        # Try to initialize Anthropic if API key is present
        if os.getenv("ANTHROPIC_API_KEY"):
            try:
                self.providers["anthropic"] = AnthropicProvider()
                logger.info("✓ Anthropic provider ready")
            except Exception as e:
                logger.warning(f"Anthropic not available: {e}")
        
        if not self.providers:
            logger.error("No LLM providers available!")
    
    def get_provider(self, provider_name: str) -> Optional[BaseLLMProvider]:
        """
        Get a specific provider
        
        Args:
            provider_name: Provider name ("ollama", "openai", "anthropic")
        
        Returns:
            Provider instance or None
        """
        return self.providers.get(provider_name)
    
    def is_available(self, provider_name: str) -> bool:
        """Check if a provider is available"""
        return provider_name in self.providers
    
    async def generate(
        self,
        prompt: str,
        provider: str = "ollama",
        **kwargs
    ) -> str:
        """
        Generate response using specified provider
        
        Args:
            prompt: Input prompt
            provider: Provider name
            **kwargs: Additional generation parameters
        
        Returns:
            Generated response
        """
        if provider not in self.providers:
            # Fallback to first available provider
            if self.providers:
                provider = list(self.providers.keys())[0]
                logger.warning(f"Provider not available, using fallback: {provider}")
            else:
                raise ValueError("No LLM providers available")
        
        llm = self.providers[provider]
        return await llm.generate(prompt, **kwargs)
    
    async def generate_stream(
        self,
        prompt: str,
        provider: str = "ollama",
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming response using specified provider
        
        Args:
            prompt: Input prompt
            provider: Provider name
            **kwargs: Additional generation parameters
        
        Yields:
            Response chunks
        """
        if provider not in self.providers:
            # Fallback to first available provider
            if self.providers:
                provider = list(self.providers.keys())[0]
                logger.warning(f"Provider not available, using fallback: {provider}")
            else:
                raise ValueError("No LLM providers available")
        
        llm = self.providers[provider]
        async for chunk in llm.generate_stream(prompt, **kwargs):
            yield chunk
    
    def get_available_providers(self) -> list[str]:
        """Get list of available providers"""
        return list(self.providers.keys())


# Global LLM service instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """
    Get or create the global LLM service instance
    
    Returns:
        LLMService instance
    """
    global _llm_service
    
    if _llm_service is None:
        _llm_service = LLMService()
    
    return _llm_service


if __name__ == "__main__":
    import asyncio
    
    async def test_llm():
        """Test LLM service"""
        print("=== Testing LLM Service ===\n")
        
        service = LLMService()
        
        print(f"Available providers: {service.get_available_providers()}\n")
        
        if not service.providers:
            print("No providers available for testing")
            return
        
        # Test prompt
        test_prompt = "Explain mindfulness in one sentence."
        
        # Test each available provider
        for provider_name in service.get_available_providers():
            print(f"--- Testing {provider_name} ---")
            
            try:
                # Test non-streaming
                print("Non-streaming response:")
                response = await service.generate(test_prompt, provider=provider_name)
                print(f"{response}\n")
                
                # Test streaming
                print("Streaming response:")
                async for chunk in service.generate_stream(test_prompt, provider=provider_name):
                    print(chunk, end='', flush=True)
                print("\n")
                
            except Exception as e:
                print(f"Error: {e}\n")
    
    # Run test
    asyncio.run(test_llm())

