'use client';

import { Message } from '@/types';

interface MessageDisplayProps {
  messages: Message[];
  currentTranscript?: string;
  isListening?: boolean;
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  );
}

export function MessageDisplay({ messages, currentTranscript, isListening }: MessageDisplayProps) {
  // Only show the last few messages to keep UI clean
  const recentMessages = messages.slice(-4);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {recentMessages.map((message) => (
        <div
          key={message.id}
          className={`p-6 rounded-2xl ${
            message.role === 'user'
              ? 'bg-gray-100 ml-12'
              : message.role === 'family'
              ? 'bg-purple-100 mr-12 border-2 border-purple-300'
              : 'bg-aa-blue text-white mr-12'
          }`}
        >
          {message.role === 'family' && (
            <p className="text-sm font-bold text-purple-700 mb-2">Family says:</p>
          )}
          <div className="flex items-start gap-3">
            <p className="text-body-lg leading-relaxed flex-1">{message.content}</p>
            {/* Show speaker icon for assistant messages with audio */}
            {message.role === 'assistant' && message.audio_url && (
              <SpeakerIcon className="w-5 h-5 text-white/70 flex-shrink-0 mt-1" />
            )}
          </div>
        </div>
      ))}

      {/* Show current transcript while listening */}
      {isListening && currentTranscript && (
        <div className="p-6 rounded-2xl bg-gray-100 ml-12 border-2 border-aa-blue border-dashed">
          <p className="text-body-lg text-gray-600 italic">{currentTranscript}...</p>
        </div>
      )}
    </div>
  );
}
