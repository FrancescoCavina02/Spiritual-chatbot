'use client';

import { useState, KeyboardEvent } from 'react';

/**
 * MessageInput Component
 * 
 * Text input for sending messages to the AI.
 * 
 * React Learning:
 * - Controlled component: Input value is controlled by React state
 * - Event handlers: onKeyDown for Enter key, onChange for typing
 * - Callback props: onSendMessage passed from parent
 */
interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');

  /**
   * Handle sending the message
   */
  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSendMessage(trimmed);
      setInput(''); // Clear input after sending
    }
  };

  /**
   * Handle Enter key press (Shift+Enter for new line)
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSend();
    }
  };

  return (
    <div className="border-t border-purple-200 bg-white/70 backdrop-blur-sm p-4">
      <div className="flex items-end space-x-3">
        {/* Text Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything... (Shift+Enter for new line)"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border-2 border-purple-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors duration-200"
          style={{ minHeight: '56px', maxHeight: '200px' }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            disabled || !input.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
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
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Thinking...</span>
            </span>
          ) : (
            '✨ Send'
          )}
        </button>
      </div>

      {/* Helpful hint */}
      <p className="text-xs text-gray-500 mt-2">
        💡 Tip: Press Enter to send, Shift+Enter for a new line
      </p>
    </div>
  );
}

