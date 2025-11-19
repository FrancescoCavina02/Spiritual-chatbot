'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/lib/api';
import MessageBubble from './MessageBubble';

/**
 * MessageList Component
 * 
 * Displays the conversation history with auto-scrolling.
 * Now with live streaming support!
 * 
 * React Learning:
 * - useRef: Create a reference to a DOM element (for scrolling)
 * - useEffect: Run side effects (scroll when messages change)
 * - map(): Loop through array and create components
 */
interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  streamingContent?: string;
}

export default function MessageList({ messages, isLoading, streamingContent }: MessageListProps) {
  // Create a reference to the bottom of the message list
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive or content streams
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧘‍♂️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome, seeker of wisdom
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            I'm here to guide you with insights from spiritual texts, psychology, 
            and self-help wisdom. What's on your mind today?
          </p>
          
          {/* Suggested Questions */}
          <div className="mt-8 space-y-2">
            <p className="text-sm text-gray-500 font-semibold">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'What is the essence of mindfulness?',
                'How can I deal with fear and anxiety?',
                'What does living in the present moment mean?',
                'How do I find my purpose?',
              ].map((question) => (
                <button
                  key={question}
                  className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm transition-colors duration-200"
                  onClick={() => {
                    // TODO: Auto-fill this question
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message Bubbles */}
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}

      {/* Streaming Message (shows AI response as it's being generated) */}
      {streamingContent && (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm">
            AI
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-md">
            <div className="whitespace-pre-wrap break-words">{streamingContent}</div>
            <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1">|</span>
          </div>
        </div>
      )}

      {/* Loading Indicator (before first token arrives) */}
      {isLoading && !streamingContent && (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm">
            AI
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-md">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

