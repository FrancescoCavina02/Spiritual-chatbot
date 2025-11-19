import { ChatMessage } from '@/lib/api';
import CitationChip from './CitationChip';

/**
 * MessageBubble Component
 * 
 * Displays a single message in the conversation.
 * Different styling for user vs AI messages.
 * 
 * React Learning:
 * - Conditional rendering: Show different UI based on message role
 * - Props: Receive data from parent component
 * - Tailwind classes: Different styles for user/AI
 */
interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-r from-pink-500 to-rose-500'
            : 'bg-gradient-to-r from-purple-500 to-indigo-500'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl p-4 shadow-md max-w-2xl ${
            isUser
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
              : 'bg-white text-gray-800'
          }`}
        >
          {/* Message Text */}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {/* Citations (only for AI messages) */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-semibold mb-2">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {message.citations.slice(0, 5).map((citation, index) => (
                  <CitationChip key={index} citation={citation} />
                ))}
                {message.citations.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{message.citations.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          {message.timestamp && (
            <div
              className={`text-xs mt-2 ${
                isUser ? 'text-pink-100' : 'text-gray-400'
              }`}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

