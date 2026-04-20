import { ChatMessage } from '@/lib/api';
import CitationChip from './CitationChip';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-amber-500 to-orange-500'
            : 'bg-gradient-to-br from-teal-500 to-teal-700'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl p-4 shadow-sm max-w-2xl ${
            isUser
              ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
              : 'bg-white text-stone-800 border border-stone-100'
          }`}
        >
          {/* Message Text */}
          <div className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>

          {/* Citations (only for AI messages) */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-xs text-stone-400 font-semibold mb-2 uppercase tracking-wide">Sources</p>
              <div className="flex flex-wrap gap-2">
                {message.citations.slice(0, 5).map((citation, index) => (
                  <CitationChip key={index} citation={citation} />
                ))}
                {message.citations.length > 5 && (
                  <span className="text-xs text-stone-400">
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
                isUser ? 'text-orange-100' : 'text-stone-300'
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
