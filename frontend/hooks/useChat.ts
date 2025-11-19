import { useState } from 'react';
import { ChatMessage, Citation, chatWithStreaming, parseSSEStream } from '@/lib/api';

/**
 * useChat Custom Hook
 * 
 * Manages chat state and streaming responses from the backend.
 * 
 * React Learning - Custom Hooks:
 * - Custom hooks let us reuse stateful logic across components
 * - They can use other hooks (useState, useEffect, etc.)
 * - Must start with "use" prefix
 * - Return values/functions that components can use
 * 
 * This hook handles:
 * - Message history
 * - Sending messages
 * - Streaming responses token-by-token
 * - Citation management
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCitations, setCurrentCitations] = useState<Citation[]>([]);
  const [streamingContent, setStreamingContent] = useState('');

  /**
   * Send a message and stream the response
   */
  const sendMessage = async (
    content: string,
    provider: 'openai' | 'ollama' | 'anthropic' | 'google' = 'openai'
  ) => {
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');
    setCurrentCitations([]);

    try {
      // Request streaming response from backend
      const stream = await chatWithStreaming({
        message: content,
        conversation_history: messages.slice(-6), // Last 6 messages for context
        provider,
      });

      let fullResponse = '';
      let citations: Citation[] = [];

      // Process the stream token by token
      for await (const message of parseSSEStream(stream)) {
        if (message.type === 'token') {
          // Add token to response
          fullResponse += message.content;
          setStreamingContent(fullResponse);
        } else if (message.type === 'citations') {
          // Received citations
          citations = message.citations || [];
          setCurrentCitations(citations);
        } else if (message.type === 'error') {
          console.error('Stream error:', message.content);
          throw new Error(message.content);
        }
      }

      // Add complete AI message to history
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: fullResponse,
        citations,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setStreamingContent('');
      
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please ensure the backend is running at http://localhost:8000',
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentCitations([]);
      
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear conversation history
   */
  const clearMessages = () => {
    setMessages([]);
    setCurrentCitations([]);
    setStreamingContent('');
  };

  return {
    messages,
    isLoading,
    currentCitations,
    streamingContent,
    sendMessage,
    clearMessages,
  };
}

