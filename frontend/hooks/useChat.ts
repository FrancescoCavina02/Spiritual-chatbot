import { useState, useEffect } from 'react';
import { ChatMessage, Citation, chatWithStreaming, parseSSEStream } from '@/lib/api';
import {
  getCurrentConversationId,
  getConversation,
  createConversation,
  saveConversation,
  type Conversation,
} from '@/lib/storage';

/**
 * useChat Custom Hook
 * 
 * Manages chat state and streaming responses from the backend.
 * NOW WITH CONVERSATION PERSISTENCE! 🎉
 * 
 * React Learning - Custom Hooks:
 * - Custom hooks let us reuse stateful logic across components
 * - They can use other hooks (useState, useEffect, etc.)
 * - Must start with "use" prefix
 * - Return values/functions that components can use
 * 
 * This hook handles:
 * - Message history with localStorage persistence
 * - Sending messages
 * - Streaming responses token-by-token
 * - Citation management
 * - Automatic conversation saving
 */
export function useChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCitations, setCurrentCitations] = useState<Citation[]>([]);
  const [streamingContent, setStreamingContent] = useState('');

  /**
   * Load conversation from localStorage on mount
   */
  useEffect(() => {
    const currentId = getCurrentConversationId();
    if (currentId) {
      const conversation = getConversation(currentId);
      if (conversation) {
        setConversationId(conversation.id);
        setMessages(conversation.messages);
      }
    }
  }, []);

  /**
   * Save conversation whenever messages change
   */
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const conversation = getConversation(conversationId);
      if (conversation) {
        conversation.messages = messages;
        // Auto-generate title from first user message
        if (conversation.title === 'New Conversation' && messages.length > 0) {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) {
            conversation.title = firstUserMsg.content.slice(0, 50) + 
              (firstUserMsg.content.length > 50 ? '...' : '');
          }
        }
        saveConversation(conversation);
      }
    }
  }, [messages, conversationId]);

  /**
   * Send a message and stream the response
   */
  const sendMessage = async (
    content: string,
    provider: 'openai' | 'ollama' | 'anthropic' | 'google' = 'openai'
  ) => {
    // Create new conversation if none exists
    let currentConvId = conversationId;
    if (!currentConvId) {
      const newConv = createConversation(content);
      currentConvId = newConv.id;
      setConversationId(currentConvId);
    }

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
   * Start a new conversation
   */
  const startNewConversation = () => {
    const newConv = createConversation();
    setConversationId(newConv.id);
    setMessages([]);
    setCurrentCitations([]);
    setStreamingContent('');
  };

  /**
   * Load an existing conversation
   */
  const loadConversation = (id: string) => {
    const conversation = getConversation(id);
    if (conversation) {
      setConversationId(id);
      setMessages(conversation.messages);
      setCurrentCitations([]);
      setStreamingContent('');
    }
  };

  return {
    conversationId,
    messages,
    isLoading,
    currentCitations,
    streamingContent,
    sendMessage,
    startNewConversation,
    loadConversation,
  };
}

