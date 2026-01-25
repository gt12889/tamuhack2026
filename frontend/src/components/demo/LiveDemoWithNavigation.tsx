'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor,
  Phone,
  Users,
  Copy,
  Check,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TranscriptPanel } from './TranscriptPanel';
import { DFWNavigationPanel } from './DFWNavigationPanel';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { useDFWJourneySimulation } from '@/hooks/useDFWJourneySimulation';
import { DFW_DEMO_RESERVATION } from '@/lib/dfwDemoData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { startConversation, createHelperLink } from '@/lib/api';

interface TranscriptMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
  isFinal: boolean;
}

interface LiveDemoWithNavigationProps {
  phoneNumber?: string;
  agentId?: string;
  onExitDemo?: () => void;
}

export function LiveDemoWithNavigation({
  phoneNumber = '+1 (877) 211-0332',
  agentId,
  onExitDemo,
}: LiveDemoWithNavigationProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'user' | null>(null);

  // Family Helper state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [helperLink, setHelperLink] = useState<string | null>(null);
  const [helperLinkExpiry, setHelperLinkExpiry] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Navigation demo state
  const [demoEnabled, setDemoEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // DFW Journey simulation
  const journeyState = useDFWJourneySimulation({
    enabled: demoEnabled && !isPaused,
    durationMs: 120000, // 2 minutes
    onWaypointReached: (waypoint) => {
      // Add navigation message to transcript
      setMessages((prev) => [
        ...prev,
        {
          id: `nav-${Date.now()}`,
          role: 'agent',
          content: `MeeMaw has reached ${waypoint.name}. ${waypoint.instruction}`,
          timestamp: new Date(),
          isFinal: true,
        },
      ]);
    },
    onArrival: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `arrival-${Date.now()}`,
          role: 'agent',
          content: "Margaret has arrived at Gate B22! She's ready for boarding.",
          timestamp: new Date(),
          isFinal: true,
        },
      ]);
    },
    departureTime: new Date(DFW_DEMO_RESERVATION.flights[0].departure_time),
  });

  const handleTranscript = useCallback(
    (role: 'agent' | 'user', text: string, isFinal: boolean) => {
      setCurrentSpeaker(role);

      setMessages((prev) => {
        const lastIndex = prev.findIndex((m) => m.role === role && !m.isFinal);

        if (lastIndex !== -1) {
          const updated = [...prev];
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: text,
            isFinal,
          };
          return updated;
        } else {
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
    },
    []
  );

  const handleCallStart = useCallback(() => {
    setMessages([]);
  }, []);

  const handleCallEnd = useCallback(() => {
    setCurrentSpeaker(null);
  }, []);

  // Generate family helper link
  const handleGenerateHelperLink = useCallback(async () => {
    setIsGeneratingLink(true);
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionResponse = await startConversation();
        currentSessionId = sessionResponse.session_id;
        setSessionId(currentSessionId);
      }

      const response = await createHelperLink(currentSessionId);
      setHelperLink(response.helper_link);
      setHelperLinkExpiry(response.expires_at);
    } catch (err) {
      console.error('Failed to generate helper link:', err);
    } finally {
      setIsGeneratingLink(false);
    }
  }, [sessionId]);

  const getHelperUrl = useCallback(() => {
    if (!helperLink) return '';
    return `${window.location.origin}/help/${helperLink}`;
  }, [helperLink]);

  const handleCopyLink = useCallback(() => {
    if (helperLink) {
      navigator.clipboard.writeText(getHelperUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [helperLink, getHelperUrl]);

  const handlePauseResume = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setDemoEnabled(false);
    setIsPaused(false);
    setMessages([]);
    setTimeout(() => setDemoEnabled(true), 100);
  }, []);

  // Handle ElevenLabs message callback
  const handleMessage = useCallback((message: { role: 'agent' | 'user'; content: string }) => {
    handleTranscript(message.role, message.content, true);
  }, [handleTranscript]);

  const {
    isConfigured,
    isConnecting,
    isConnected,
    startCall,
    endCall,
    error,
    hasAgentId,
    isSdkLoaded,
  } = useElevenLabsConversation({
    agentId,
    onConnect: handleCallStart,
    onDisconnect: handleCallEnd,
    onMessage: handleMessage,
    onError: (err) => {
      console.error('ElevenLabs error:', err);
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header showDemoToggle isDemoMode onDemoToggle={onExitDemo} />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Demo Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-aa-blue text-white rounded-xl p-4 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6" />
                <div>
                  <h2 className="font-bold">Live Demo Mode - DFW Airport Navigation</h2>
                  <p className="text-sm opacity-90">
                    Watching MeeMaw navigate from Terminal A to Gate B22
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Demo Controls */}
                <Button
                  onClick={handlePauseResume}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  title={isPaused ? 'Resume' : 'Pause'}
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  title="Reset Demo"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                {onExitDemo && (
                  <Button
                    onClick={onExitDemo}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    title="Exit Demo"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}

                {/* Call Controls */}
                {isConfigured && (
                  <>
                    {!isConnected ? (
                      <Button
                        onClick={startCall}
                        disabled={isConnecting || !hasAgentId || !isSdkLoaded}
                        className="bg-white text-aa-blue hover:bg-gray-100"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {isConnecting
                          ? 'Connecting...'
                          : !isSdkLoaded
                          ? 'Loading SDK...'
                          : 'Start Call'}
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
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Split View: Transcript + Navigation Map */}
          <div className="grid lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 340px)' }}>
            {/* Left: Live Call Transcript */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
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

            {/* Right: DFW Navigation Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="h-full overflow-y-auto"
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 h-full">
                <DFWNavigationPanel
                  journeyState={journeyState}
                  passengerName="MeeMaw"
                  className="h-full"
                />
              </div>
            </motion.div>
          </div>

          {/* Bottom Navigation Instruction Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'mt-6 rounded-xl p-4 border-2',
              journeyState.alertStatus === 'safe' && 'bg-green-50 border-green-200',
              journeyState.alertStatus === 'warning' && 'bg-yellow-50 border-yellow-200',
              journeyState.alertStatus === 'urgent' && 'bg-red-50 border-red-200',
              journeyState.alertStatus === 'arrived' && 'bg-blue-50 border-blue-200'
            )}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">
                {journeyState.alertStatus === 'arrived' ? '🎉' : '🚶'}
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-gray-800">
                  {journeyState.currentInstruction}
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg">{journeyState.distanceToGate}m</p>
                  <p className="text-gray-500">to gate</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">~{journeyState.estimatedTimeRemaining} min</p>
                  <p className="text-gray-500">walk</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{journeyState.timeToDeparture} min</p>
                  <p className="text-gray-500">to departure</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Family Helper Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Family Helper Link</h3>
                  <p className="text-sm opacity-90">
                    Share with family to let them watch MeeMaw's journey
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!helperLink ? (
                  <Button
                    onClick={handleGenerateHelperLink}
                    disabled={isGeneratingLink}
                    className="bg-white text-purple-700 hover:bg-gray-100"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {isGeneratingLink ? 'Generating...' : 'Generate Helper Link'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 rounded-lg px-3 py-2 text-sm font-mono max-w-xs truncate">
                      {getHelperUrl()}
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      size="icon"
                      className="bg-white/20 hover:bg-white/30"
                      title="Copy link"
                    >
                      {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => window.open(getHelperUrl(), '_blank')}
                      size="icon"
                      className="bg-white/20 hover:bg-white/30"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {helperLink && helperLinkExpiry && (
              <p className="text-xs opacity-75 mt-2">
                Link expires at {new Date(helperLinkExpiry).toLocaleTimeString()}
              </p>
            )}
          </motion.div>

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

          {/* ElevenLabs Not Configured Notice */}
          {!isConfigured && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg"
            >
              <p className="font-semibold">ElevenLabs Conversational AI not configured</p>
              <p className="text-sm mt-1">
                Voice calls are disabled. Configure ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID to enable.
                The navigation demo works without it.
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
