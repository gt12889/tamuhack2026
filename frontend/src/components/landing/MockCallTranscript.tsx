'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, Bot, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock booking conversation scenario
const MOCK_TRANSCRIPT = [
  {
    role: 'user' as const,
    content: "Hi, I'd like to book a flight please.",
    delayMs: 1500,
  },
  {
    role: 'agent' as const,
    content: "I'd be happy to help you book a flight. Where will you be flying from?",
    delayMs: 2500,
  },
  {
    role: 'user' as const,
    content: 'Dallas',
    delayMs: 2000,
  },
  {
    role: 'agent' as const,
    content: 'Great, flying from Dallas. Where would you like to go?',
    delayMs: 2000,
  },
  {
    role: 'user' as const,
    content: 'Chicago',
    delayMs: 1800,
  },
  {
    role: 'agent' as const,
    content: 'Flying from Dallas to Chicago. What date would you like to travel?',
    delayMs: 2200,
  },
  {
    role: 'user' as const,
    content: 'Tomorrow',
    delayMs: 1500,
  },
  {
    role: 'agent' as const,
    content: 'I found 3 flights from Dallas to Chicago. Option 1: 8:00 AM for $249. Option 2: 2:00 PM for $279. Option 3: 7:00 PM for $299. Which flight works best for you?',
    delayMs: 4000,
  },
  {
    role: 'user' as const,
    content: 'The morning flight please',
    delayMs: 2500,
  },
  {
    role: 'agent' as const,
    content: "Great choice! The 8:00 AM flight on AA4521. Now I just need your name for the booking. What is your first and last name?",
    delayMs: 3000,
  },
  {
    role: 'user' as const,
    content: 'Margaret Johnson',
    delayMs: 2000,
  },
  {
    role: 'agent' as const,
    content: "Wonderful, Margaret! Your flight is booked. You're confirmed on flight AA4521 from Dallas to Chicago, departing tomorrow at 8:00 AM. Your confirmation code is M-E-E-M-A-W. Please write that down. Is there anything else I can help you with?",
    delayMs: 5000,
  },
  {
    role: 'user' as const,
    content: "No, that's all. Thank you so much!",
    delayMs: 2500,
  },
  {
    role: 'agent' as const,
    content: "You're welcome, Margaret! Have a wonderful flight. Take care!",
    delayMs: 2000,
  },
];

interface DisplayMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  displayedContent: string;
  isTyping: boolean;
}

export function MockCallTranscript({ className }: { className?: string }) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'user' | null>(null);
  const [typingText, setTypingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingText]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // Type out text character by character
  const typeMessage = useCallback((text: string, onComplete: () => void) => {
    let charIndex = 0;
    setTypingText('');

    typingIntervalRef.current = setInterval(() => {
      if (charIndex < text.length) {
        setTypingText(text.substring(0, charIndex + 1));
        charIndex++;
      } else {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        onComplete();
      }
    }, 25); // Typing speed
  }, []);

  // Play next message
  const playNextMessage = useCallback(() => {
    if (currentIndex >= MOCK_TRANSCRIPT.length) {
      // Reset and restart after a pause
      timeoutRef.current = setTimeout(() => {
        setMessages([]);
        setCurrentIndex(0);
        setCurrentSpeaker(null);
        setTypingText('');
      }, 4000);
      return;
    }

    const msg = MOCK_TRANSCRIPT[currentIndex];
    setIsTyping(true);
    setCurrentSpeaker(msg.role);

    // Start typing animation
    typeMessage(msg.content, () => {
      // Add completed message
      const newMessage: DisplayMessage = {
        id: `msg-${currentIndex}-${Date.now()}`,
        role: msg.role,
        content: msg.content,
        displayedContent: msg.content,
        isTyping: false,
      };

      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
      setTypingText('');
      setCurrentIndex(prev => prev + 1);
    });
  }, [currentIndex, typeMessage]);

  // Drive playback
  useEffect(() => {
    const nextMsg = MOCK_TRANSCRIPT[currentIndex];
    const delay = currentIndex === 0 ? 1000 : (nextMsg?.delayMs || 2000);

    timeoutRef.current = setTimeout(() => {
      playNextMessage();
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex, playNextMessage]);

  const isComplete = currentIndex >= MOCK_TRANSCRIPT.length;

  return (
    <div className={cn('flex flex-col bg-gray-900 text-white rounded-2xl overflow-hidden shadow-2xl', className)}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">Live Call Demo</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              isComplete ? 'bg-gray-500' : 'bg-green-500 animate-pulse'
            )}
          />
          <span className="text-sm text-gray-400">
            {isComplete ? 'Restarting...' : 'Call Active'}
          </span>
        </div>
      </div>

      {/* Current Speaker Indicator */}
      <AnimatePresence>
        {isTyping && currentSpeaker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 px-4 py-2 flex items-center gap-2 border-b border-gray-700"
          >
            <Mic className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-sm text-gray-300">
              {currentSpeaker === 'agent' ? 'MeeMaw Assistant is speaking...' : 'Margaret is speaking...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
                  message.role === 'agent' ? 'bg-blue-600' : 'bg-gray-600'
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
                  'rounded-2xl px-4 py-2 max-w-[80%]',
                  message.role === 'agent'
                    ? 'bg-gray-700 text-white rounded-tl-sm'
                    : 'bg-blue-600 text-white rounded-tr-sm'
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator with live text */}
        <AnimatePresence>
          {isTyping && typingText && (
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
                  currentSpeaker === 'agent' ? 'bg-blue-600' : 'bg-gray-600'
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
                  'rounded-2xl px-4 py-2 max-w-[80%]',
                  currentSpeaker === 'agent'
                    ? 'bg-gray-700 rounded-tl-sm'
                    : 'bg-blue-600 rounded-tr-sm'
                )}
              >
                <p className="text-sm leading-relaxed">
                  {typingText}
                  <span className="inline-block w-0.5 h-4 bg-white/70 ml-0.5 animate-pulse" />
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Simulated booking conversation with MeeMaw Voice Assistant
        </p>
      </div>
    </div>
  );
}
