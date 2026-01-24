'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, Bot, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
  isFinal: boolean;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  currentSpeaker?: 'agent' | 'user' | null;
  className?: string;
}

export function TranscriptPanel({
  messages,
  isConnected,
  isConnecting,
  currentSpeaker,
  className,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={cn("flex flex-col h-full bg-gray-900 text-white rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-aa-blue" />
          <span className="font-semibold">Live Call Transcript</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : isConnecting ? "bg-yellow-500 animate-pulse" : "bg-gray-500"
            )}
          />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Waiting for call'}
          </span>
        </div>
      </div>

      {/* Current Speaker Indicator */}
      <AnimatePresence>
        {isConnected && currentSpeaker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 px-4 py-2 flex items-center gap-2 border-b border-gray-700"
          >
            <Mic className="w-4 h-4 text-aa-red animate-pulse" />
            <span className="text-sm text-gray-300">
              {currentSpeaker === 'agent' ? 'AI Agent is speaking...' : 'Customer is speaking...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isConnecting && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Phone className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-center">Waiting for someone to call...</p>
            <p className="text-sm text-gray-600 mt-1">The transcript will appear here</p>
          </div>
        )}

        {isConnecting && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-12 h-12 border-4 border-aa-blue border-t-transparent rounded-full animate-spin mb-3" />
            <p>Connecting to call...</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  message.role === 'agent' ? 'bg-aa-blue' : 'bg-gray-600'
                )}
              >
                {message.role === 'agent' ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.role === 'agent'
                    ? 'bg-gray-700 text-white rounded-tl-sm'
                    : 'bg-aa-blue text-white rounded-tr-sm',
                  !message.isFinal && 'opacity-70'
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {!message.isFinal && (
                  <span className="text-xs opacity-60 mt-1 block">Transcribing...</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Real-time transcription powered by Retell AI
        </p>
      </div>
    </div>
  );
}
