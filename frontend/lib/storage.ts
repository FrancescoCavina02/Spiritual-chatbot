/**
 * Local Storage Utilities for Chat Persistence
 * 
 * Implements conversation persistence like ChatGPT/Claude/Gemini:
 * - Saves conversations to browser localStorage
 * - Automatically saves on every message
 * - Retrieves conversation history on load
 * - Allows creating new conversations
 * 
 * Future enhancement: Sync to backend for cross-device access
 */

import { ChatMessage } from './api';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'spiritual-ai-conversations';
const CURRENT_CONVERSATION_KEY = 'spiritual-ai-current-conversation';

/**
 * Get all conversations from localStorage
 */
export function getAllConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
}

/**
 * Get a specific conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  const conversations = getAllConversations();
  return conversations.find(c => c.id === id) || null;
}

/**
 * Get the current active conversation ID
 */
export function getCurrentConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
}

/**
 * Set the current active conversation ID
 */
export function setCurrentConversationId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_CONVERSATION_KEY, id);
}

/**
 * Save a conversation (create or update)
 */
export function saveConversation(conversation: Conversation): void {
  if (typeof window === 'undefined') return;
  
  try {
    const conversations = getAllConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);
    
    if (index >= 0) {
      // Update existing
      conversations[index] = {
        ...conversation,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Create new
      conversations.push({
        ...conversation,
        createdAt: conversation.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

/**
 * Create a new conversation
 */
export function createConversation(firstMessage?: string): Conversation {
  const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const title = firstMessage 
    ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
    : 'New Conversation';
  
  const conversation: Conversation = {
    id,
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  saveConversation(conversation);
  setCurrentConversationId(id);
  
  return conversation;
}

/**
 * Delete a conversation
 */
export function deleteConversation(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const conversations = getAllConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // If deleting current conversation, clear it
    if (getCurrentConversationId() === id) {
      localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
}

/**
 * Update conversation title (auto-generated from first message)
 */
export function updateConversationTitle(id: string, newTitle: string): void {
  const conversation = getConversation(id);
  if (conversation) {
    conversation.title = newTitle;
    saveConversation(conversation);
  }
}

/**
 * Clear all conversations (for privacy/reset)
 */
export function clearAllConversations(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CURRENT_CONVERSATION_KEY);
}

