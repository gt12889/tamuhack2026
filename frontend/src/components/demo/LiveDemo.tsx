'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Phone, ExternalLink } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CallToAction } from '@/components/landing/CallToAction';
import { TranscriptPanel } from './TranscriptPanel';
import { useRetell } from '@/hooks/useRetell';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TranscriptMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
  isFinal: boolean;
}

interface LiveDemoProps {
  phoneNumber?: string;
  agentId?: string;
  onExitDemo?: () => void;
}

export function LiveDemo({
  phoneNumber = '+1-800-555-1234',
  agentId,
  onExitDemo,
}: LiveDemoProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'user' | null>(null);

  const handleTranscript = useCallback((role: 'agent' | 'user', text: string, isFinal: boolean) => {
    setCurrentSpeaker(role);

    setMessages((prev) => {
      // Find existing non-final message from same role
      const lastIndex = prev.findIndex(
        (m) => m.role === role && !m.isFinal
      );

      if (lastIndex !== -1) {
        // Update existing message
        const updated = [...prev];
        updated[lastIndex] = {
          ...updated[lastIndex],
          content: text,
          isFinal,
        };
        return updated;
      } else {
        // Add new message
        return [
          ...prev,
          {
            id: `${role}-${Date.now()}`,
            role,
            content: text,
            timestamp: new Date(),
            isFinal,
          },
        ];
      }
    });

    if (isFinal) {
      setCurrentSpeaker(null);
    }
  }, []);

  const handleCallStart = useCallback(() => {
    setMessages([]);
  }, []);

  const handleCallEnd = useCallback(() => {
    setCurrentSpeaker(null);
  }, []);

  const {
    isConfigured,
    isConnecting,
    isConnected,
    startCall,
    endCall,
    error,
  } = useRetell({
    agentId,
    onCallStart: handleCallStart,
    onCallEnd: handleCallEnd,
    onTranscript: handleTranscript,
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header
        showDemoToggle
        isDemoMode
        onDemoToggle={onExitDemo}
      />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Demo Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-aa-blue text-white rounded-xl p-4 mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Monitor className="w-6 h-6" />
              <div>
                <h2 className="font-bold">Demo Mode</h2>
                <p className="text-sm opacity-90">Showing live call transcript for judges</p>
              </div>
            </div>
            {isConfigured && (
              <div className="flex items-center gap-3">
                {!isConnected ? (
                  <Button
                    onClick={startCall}
                    disabled={isConnecting}
                    className="bg-white text-aa-blue hover:bg-gray-100"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {isConnecting ? 'Connecting...' : 'Start Web Call'}
                  </Button>
                ) : (
                  <Button
                    onClick={endCall}
                    variant="destructive"
                    className="bg-aa-red hover:bg-red-700"
                  >
                    End Call
                  </Button>
                )}
              </div>
            )}
          </motion.div>

          {/* Split View */}
          <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]">
            {/* Left: Landing Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col"
            >
              <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-500 ml-2">Customer View</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <CallToAction phoneNumber={phoneNumber} />
              </div>
            </motion.div>

            {/* Right: Transcript */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="h-full"
            >
              <TranscriptPanel
                messages={messages}
                isConnected={isConnected}
                isConnecting={isConnecting}
                currentSpeaker={currentSpeaker}
                className="h-full shadow-lg"
              />
            </motion.div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Instructions for Demo */}
          {!isConfigured && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg"
            >
              <p className="font-semibold">Retell AI not configured</p>
              <p className="text-sm mt-1">
                To enable web calls, configure RETELL_API_KEY and RETELL_AGENT_ID in your environment.
                You can still demo by calling the phone number.
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
