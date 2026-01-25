'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, Bot, Play, Pause, RotateCcw, AlertCircle, ArrowRightLeft, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemoScenario } from '@/lib/demoScenarios';

interface DemoTranscriptProps {
  scenario: DemoScenario;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onEvent?: (event: 'handoff' | 'alert' | 'action' | 'rebooking') => void;
  className?: string;
}

interface DisplayMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  isTyping: boolean;
  event?: string;
}

export function DemoTranscript({
  scenario,
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onEvent,
  className,
}: DemoTranscriptProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'user' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scenarioIdRef = useRef(scenario.id);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset when scenario changes
  useEffect(() => {
    if (scenarioIdRef.current !== scenario.id) {
      scenarioIdRef.current = scenario.id;
      setMessages([]);
      setCurrentIndex(0);
      setIsTyping(false);
      setCurrentSpeaker(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [scenario.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Play next message
  const playNextMessage = useCallback(() => {
    if (currentIndex >= scenario.transcript.length) {
      onPause();
      setCurrentSpeaker(null);
      return;
    }

    const msg = scenario.transcript[currentIndex];

    // Show typing indicator
    setIsTyping(true);
    setCurrentSpeaker(msg.role);

    // Calculate typing time based on message length (simulate realistic typing)
    const typingTime = Math.min(Math.max(msg.content.length * 30, 500), 2000);

    timeoutRef.current = setTimeout(() => {
      // Add the message
      const newMessage: DisplayMessage = {
        id: `${scenario.id}-${currentIndex}`,
        role: msg.role,
        content: msg.content,
        isTyping: false,
        event: msg.event,
      };

      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(false);

      // Trigger event callback if present
      if (msg.event && onEvent) {
        onEvent(msg.event);
      }

      // Move to next message
      setCurrentIndex((prev) => prev + 1);

      // Schedule next message
      const nextIdx = currentIndex + 1;
      if (nextIdx < scenario.transcript.length) {
        const delay = scenario.transcript[nextIdx].delayMs || 2000;
        timeoutRef.current = setTimeout(() => {
          // This will trigger the next iteration via the effect below
        }, delay);
      } else {
        setCurrentSpeaker(null);
      }
    }, typingTime);
  }, [currentIndex, scenario, onEvent, onPause]);

  // Effect to drive playback
  useEffect(() => {
    if (!isPlaying) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (currentIndex < scenario.transcript.length) {
      const msg = scenario.transcript[currentIndex];
      const delay = currentIndex === 0 ? 500 : msg.delayMs || 2000;

      timeoutRef.current = setTimeout(() => {
        playNextMessage();
      }, messages.length === 0 ? 500 : delay);
    } else {
      onPause();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentIndex, scenario.transcript.length, messages.length, playNextMessage, onPause]);

  const handleReset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMessages([]);
    setCurrentIndex(0);
    setIsTyping(false);
    setCurrentSpeaker(null);
    onReset();
  };

  const isComplete = currentIndex >= scenario.transcript.length && !isTyping;

  return (
    <div className={cn('flex flex-col bg-gray-900 text-white rounded-2xl overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-aa-blue" />
          <span className="font-semibold">Live Call Transcript</span>
          <span className="text-xs text-gray-400 ml-2">
            {scenario.passenger.nickname || scenario.passenger.firstName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              isPlaying ? 'bg-green-500 animate-pulse' : isComplete ? 'bg-gray-500' : 'bg-yellow-500'
            )}
          />
          <span className="text-sm text-gray-400">
            {isPlaying ? 'Call Active' : isComplete ? 'Call Ended' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Current Speaker Indicator */}
      <AnimatePresence>
        {isPlaying && currentSpeaker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 px-4 py-2 flex items-center gap-2 border-b border-gray-700"
          >
            <Mic className="w-4 h-4 text-aa-red animate-pulse" />
            <span className="text-sm text-gray-300">
              {currentSpeaker === 'agent' ? 'AI Agent is speaking...' : `${scenario.passenger.nickname || scenario.passenger.firstName} is speaking...`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[350px]">
        {messages.length === 0 && !isPlaying && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
            <Phone className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-center">Press Play to start the demo call</p>
            <p className="text-sm text-gray-600 mt-1">
              {scenario.name} - {scenario.shortDescription}
            </p>
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
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
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
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2',
                    message.role === 'agent'
                      ? 'bg-gray-700 text-white rounded-tl-sm'
                      : 'bg-aa-blue text-white rounded-tr-sm'
                  )}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {/* Event indicator */}
                {message.event && (
                  <div className={cn(
                    'flex items-center gap-1 mt-1 text-xs',
                    message.role === 'agent' ? 'justify-start' : 'justify-end'
                  )}>
                    {message.event === 'handoff' && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <ArrowRightLeft className="w-3 h-3" />
                        Connecting to agent
                      </span>
                    )}
                    {message.event === 'alert' && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        Alert triggered
                      </span>
                    )}
                    {message.event === 'action' && (
                      <span className="flex items-center gap-1 text-green-400">
                        Action completed
                      </span>
                    )}
                    {message.event === 'rebooking' && (
                      <span className="flex items-center gap-1 text-orange-400">
                        Rebooking options available
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex gap-3',
                currentSpeaker === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  currentSpeaker === 'agent' ? 'bg-aa-blue' : 'bg-gray-600'
                )}
              >
                {currentSpeaker === 'agent' ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={cn(
                  'rounded-2xl px-4 py-3',
                  currentSpeaker === 'agent'
                    ? 'bg-gray-700 rounded-tl-sm'
                    : 'bg-aa-blue rounded-tr-sm'
                )}
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 py-3 border-t border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={onPlay}
              disabled={isComplete}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                isComplete
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              )}
            >
              <Play className="w-4 h-4" />
              {messages.length === 0 ? 'Start Call' : 'Resume'}
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        {/* Progress indicator */}
        <div className="text-sm text-gray-400">
          {messages.length} / {scenario.transcript.length} messages
        </div>
      </div>
    </div>
  );
}
