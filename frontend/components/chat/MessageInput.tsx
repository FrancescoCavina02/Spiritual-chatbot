'use client';

import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSendMessage(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-stone-200 bg-white/80 backdrop-blur-sm p-4">
      <div className="flex items-end space-x-3">
        {/* Text Input */}
        <textarea
          id="chat-message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about spirituality, mindfulness, or life guidance… (Enter to send)"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border-2 border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-400 disabled:bg-stone-50 disabled:cursor-not-allowed transition-colors duration-200 text-stone-800 placeholder:text-stone-400"
          style={{ minHeight: '56px', maxHeight: '200px' }}
        />

        {/* Send Button */}
        <button
          id="chat-send-button"
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          aria-label="Send message"
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            disabled || !input.trim()
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-gradient-to-br from-teal-500 to-teal-700 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {disabled ? (
            <span className="flex items-center space-x-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Thinking…</span>
            </span>
          ) : (
            'Send'
          )}
        </button>
      </div>

      <p className="text-xs text-stone-400 mt-2">
        Enter to send · Shift+Enter for a new line · Powered by RAG + GPT-4
      </p>
    </div>
  );
}
