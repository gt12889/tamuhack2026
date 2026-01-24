'use client';

import { Message } from '@/types';

interface MessageDisplayProps {
  messages: Message[];
  currentTranscript?: string;
  isListening?: boolean;
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
          <p className="text-body-lg leading-relaxed">{message.content}</p>
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
