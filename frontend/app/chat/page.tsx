'use client';

import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import CitationPanel from '@/components/chat/CitationPanel';
import { useChat } from '@/hooks/useChat';

/**
 * Chat Page Component
 * 
 * Now using our custom useChat hook for all chat logic!
 * This makes the component much cleaner and easier to understand.
 * 
 * React Learning:
 * - Custom hooks extract complex logic into reusable functions
 * - Component focuses on UI, hook handles state/API calls
 * - Much easier to test and maintain
 */
export default function ChatPage() {
  // Our custom hook handles all the chat logic!
  const { messages, isLoading, currentCitations, streamingContent, sendMessage } = useChat();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-t-2xl p-6 shadow-lg border-b border-purple-200">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Chat with Your Spiritual Guide
        </h1>
        <p className="text-gray-600 mt-2">
          Ask me anything about spirituality, mindfulness, or life guidance
        </p>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 bg-white/50 backdrop-blur-sm overflow-hidden">
        {/* Messages Section */}
        <div className="flex-1 flex flex-col">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            streamingContent={streamingContent}
          />
          <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
        </div>

        {/* Citations Sidebar */}
        {currentCitations.length > 0 && (
          <div className="w-80 border-l border-purple-200">
            <CitationPanel citations={currentCitations} />
          </div>
        )}
      </div>
    </div>
  );
}

