'use client';

import { useState } from 'react';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import CitationPanel from '@/components/chat/CitationPanel';
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import { useChat } from '@/hooks/useChat';

/**
 * Chat Page Component with Conversation History
 * 
 * Fully featured chat interface with:
 * - Conversation history sidebar (ChatGPT-style)
 * - Message list with streaming responses
 * - Citation panel for RAG sources
 * - Mobile-responsive design
 * 
 * React Learning:
 * - Custom hooks for complex state management
 * - Responsive layout with sidebar
 * - Conditional rendering based on screen size
 * - Component composition with multiple panels
 */
export default function ChatPage() {
  const { 
    conversationId,
    messages, 
    isLoading, 
    currentCitations, 
    streamingContent, 
    sendMessage,
    startNewConversation,
    loadConversation,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen max-w-full overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Conversation History Sidebar */}
      <ConversationSidebar
        currentConversationId={conversationId}
        onNewConversation={startNewConversation}
        onLoadConversation={loadConversation}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Fixed Header - Does not scroll */}
        <div className="flex-shrink-0 bg-white/70 backdrop-blur-sm p-4 md:p-6 shadow-lg border-b border-purple-200 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-purple-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                Chat with Your Spiritual Guide
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Ask me anything about spirituality, mindfulness, or life guidance
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Chat Content */}
        <div className="flex flex-1 bg-white/50 backdrop-blur-sm overflow-hidden min-h-0">
          {/* Messages Section - This scrolls */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <MessageList 
              messages={messages} 
              isLoading={isLoading} 
              streamingContent={streamingContent}
            />
            <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
          </div>

          {/* Citations Sidebar (Desktop only) - This scrolls independently */}
          {currentCitations.length > 0 && (
            <div className="hidden lg:block w-80 border-l border-purple-200 overflow-y-auto">
              <CitationPanel citations={currentCitations} />
            </div>
          )}
        </div>

        {/* Mobile Citations (Bottom sheet on mobile) */}
        {currentCitations.length > 0 && (
          <div className="lg:hidden border-t border-purple-200 bg-white max-h-48 overflow-y-auto flex-shrink-0">
            <CitationPanel citations={currentCitations} />
          </div>
        )}
      </div>
    </div>
  );
}

