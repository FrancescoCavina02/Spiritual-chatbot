'use client';

import { useEffect, useState } from 'react';
import { getAllConversations, deleteConversation, ConversationMetadata } from '@/lib/storage';
import Link from 'next/link';

/**
 * Conversation History Sidebar Component
 * 
 * Displays all saved conversations with:
 * - List of conversations sorted by most recent
 * - New conversation button
 * - Delete conversation functionality
 * - Active conversation highlighting
 * - Relative timestamps
 * - Search/filter (future enhancement)
 * 
 * React Learning:
 * - State management for conversations list
 * - Real-time updates with useEffect
 * - Event handlers for delete/select
 * - Conditional rendering and styling
 * - Date formatting with relative time
 */

interface ConversationSidebarProps {
  currentConversationId: string | null;
  onNewConversation: () => void;
  onLoadConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ConversationSidebar({
  currentConversationId,
  onNewConversation,
  onLoadConversation,
  isOpen,
  onToggle,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load conversations on mount and when currentConversationId changes
  useEffect(() => {
    loadConversations();
  }, [currentConversationId]);

  const loadConversations = () => {
    const allConversations = getAllConversations();
    setConversations(allConversations);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      // Confirmed - delete it
      deleteConversation(id);
      loadConversations();
      setDeleteConfirmId(null);
      
      // If deleted conversation was current, trigger new conversation
      if (id === currentConversationId) {
        onNewConversation();
      }
    } else {
      // First click - show confirm
      setDeleteConfirmId(id);
      // Auto-cancel after 3 seconds
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleLoadConversation = (id: string) => {
    onLoadConversation(id);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  /**
   * Format timestamp as relative time (e.g., "2 hours ago", "3 days ago")
   */
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Format as date if older than a week
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-md shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-80 md:translate-x-0 md:relative md:w-64 lg:w-72 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              💬 Conversations
            </h2>
            <button
              onClick={onToggle}
              className="md:hidden p-2 hover:bg-purple-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* New Conversation Button */}
          <button
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 768) onToggle();
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">💭</div>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-2">Start chatting to create one!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative rounded-lg transition-all duration-200 ${
                  conv.id === currentConversationId
                    ? 'bg-purple-100 border-2 border-purple-400 shadow-md'
                    : 'bg-white hover:bg-purple-50 border-2 border-transparent hover:border-purple-200'
                }`}
              >
                {/* Conversation Item */}
                <button
                  onClick={() => handleLoadConversation(conv.id)}
                  className="w-full text-left p-3 pr-10"
                >
                  <h3
                    className={`font-semibold text-sm mb-1 truncate ${
                      conv.id === currentConversationId
                        ? 'text-purple-800'
                        : 'text-gray-800 group-hover:text-purple-600'
                    }`}
                  >
                    {conv.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(conv.updatedAt)}
                  </p>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(conv.id)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                    deleteConfirmId === conv.id
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100'
                  }`}
                  title={deleteConfirmId === conv.id ? 'Click again to confirm' : 'Delete conversation'}
                >
                  {deleteConfirmId === conv.id ? '⚠️' : '🗑️'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="text-xs text-gray-600 text-center">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 md:hidden p-3 bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-30"
          aria-label="Open sidebar"
        >
          💬
        </button>
      )}
    </>
  );
}

