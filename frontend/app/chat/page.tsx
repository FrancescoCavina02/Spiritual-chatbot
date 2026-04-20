'use client';

import { useState } from 'react';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import CitationPanel from '@/components/chat/CitationPanel';
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import { useChat } from '@/hooks/useChat';

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
    <div className="flex h-screen max-w-full overflow-hidden bg-gradient-to-br from-stone-50 via-teal-50/30 to-amber-50/20">
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
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm p-4 md:p-6 shadow-sm border-b border-stone-200 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-teal-50 rounded-lg transition-colors"
              aria-label="Toggle conversation sidebar"
              id="sidebar-toggle-button"
            >
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent truncate">
                Spiritual AI Guide
              </h1>
              <p className="text-stone-500 mt-0.5 text-sm md:text-base">
                RAG-powered · 1,649 notes · GPT-4 Turbo · Grounded citations
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Chat Content */}
        <div className="flex flex-1 bg-stone-50/50 overflow-hidden min-h-0">
          {/* Messages + Input */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <MessageList
              messages={messages}
              isLoading={isLoading}
              streamingContent={streamingContent}
              onSuggestedQuestion={sendMessage}
            />
            <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
          </div>

          {/* Citations Sidebar (Desktop) */}
          {currentCitations.length > 0 && (
            <div
              id="citation-panel-desktop"
              className="hidden lg:block w-80 border-l border-stone-200 overflow-y-auto bg-white/70"
            >
              <CitationPanel citations={currentCitations} />
            </div>
          )}
        </div>

        {/* Mobile Citations */}
        {currentCitations.length > 0 && (
          <div
            id="citation-panel-mobile"
            className="lg:hidden border-t border-stone-200 bg-white max-h-48 overflow-y-auto flex-shrink-0"
          >
            <CitationPanel citations={currentCitations} />
          </div>
        )}
      </div>
    </div>
  );
}
