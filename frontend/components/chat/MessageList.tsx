'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/lib/api';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  streamingContent?: string;
  onSuggestedQuestion?: (question: string) => void;
}

export default function MessageList({
  messages,
  isLoading,
  streamingContent,
  onSuggestedQuestion,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Welcome State */}
      {messages.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧘</div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">
            Welcome, seeker of wisdom
          </h2>
          <p className="text-stone-600 max-w-md mx-auto">
            I draw wisdom from 1,649 personal notes on spirituality, psychology, philosophy,
            and self-help — every response is grounded in real sources and cited.
          </p>

          {/* Suggested Questions */}
          <div className="mt-8 space-y-2">
            <p className="text-sm text-stone-500 font-semibold">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'What is the essence of mindfulness?',
                'How can I deal with fear and anxiety?',
                'What does living in the present moment mean?',
                'How do I build better habits?',
              ].map((question) => (
                <button
                  key={question}
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-sm transition-colors duration-200"
                  onClick={() => onSuggestedQuestion?.(question)}
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            AI
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-md border border-stone-100">
            <div className="whitespace-pre-wrap break-words text-stone-800">{streamingContent}</div>
            <span className="inline-block w-0.5 h-4 bg-teal-500 animate-pulse ml-1" />
          </div>
        </div>
      )}

      {/* Loading Indicator (shown before first token arrives) */}
      {isLoading && !streamingContent && (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            AI
          </div>
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-md border border-stone-100">
            <p className="text-sm text-stone-400 mb-2">Searching knowledge base and thinking…</p>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
