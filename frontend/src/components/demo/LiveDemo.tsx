'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Phone, Users, Copy, Check, ExternalLink, PlayCircle, Headphones, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CallToAction } from '@/components/landing/CallToAction';
import { TranscriptPanel } from './TranscriptPanel';
import { SampleWorkflowDemo } from './SampleWorkflowDemo';
import { useElevenLabsConversation } from '@/hooks/useElevenLabsConversation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { startConversation, createHelperLink } from '@/lib/api';
import { generateDemoHandoffId, createContextualHandoff, type LiveTranscriptMessage } from '@/lib/handoffDemoData';

// Re-export for TranscriptPanel compatibility
type TranscriptMessage = LiveTranscriptMessage;

interface LiveDemoProps {
  phoneNumber?: string;
  agentId?: string;
  onExitDemo?: () => void;
}

export function LiveDemo({
  phoneNumber = '+1 (877) 211-0332',
  agentId,
  onExitDemo,
}: LiveDemoProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<'agent' | 'user' | null>(null);

  // Family Helper state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [helperLink, setHelperLink] = useState<string | null>(null);
  const [helperLinkExpiry, setHelperLinkExpiry] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Sample workflow demo state
  const [showSampleDemo, setShowSampleDemo] = useState(false);

  // Agent handoff state
  const [handoffId, setHandoffId] = useState<string | null>(null);
  const [isCreatingHandoff, setIsCreatingHandoff] = useState(false);
  const [handoffLinkCopied, setHandoffLinkCopied] = useState(false);

  const handleTranscript = useCallback((role: 'agent' | 'user', text: string, isFinal: boolean) => {
    setMessages((prev) => {
      // Find existing non-final message from same role (most recent)
      let lastIndex = -1;
      for (let i = prev.length - 1; i >= 0; i -= 1) {
        if (prev[i].role === role && !prev[i].isFinal) {
          lastIndex = i;
          break;
        }
      }

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
  }, []);

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
      // Start a conversation session if we don't have one
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionResponse = await startConversation();
        currentSessionId = sessionResponse.session_id;
        setSessionId(currentSessionId);
      }

      // Create the helper link
      const response = await createHelperLink(currentSessionId);
      setHelperLink(response.helper_link);
      setHelperLinkExpiry(response.expires_at);
    } catch (err) {
      console.error('Failed to generate helper link:', err);
    } finally {
      setIsGeneratingLink(false);
    }
  }, [sessionId]);

  // Get full helper URL
  const getHelperUrl = useCallback(() => {
    if (!helperLink) return '';
    return `${window.location.origin}/help/${helperLink}`;
  }, [helperLink]);

  // Copy helper link to clipboard
  const handleCopyLink = useCallback(() => {
    if (helperLink) {
      navigator.clipboard.writeText(getHelperUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [helperLink, getHelperUrl]);

  // Create agent handoff
  const handleCreateHandoff = useCallback(() => {
    setIsCreatingHandoff(true);
    try {
      const newHandoffId = generateDemoHandoffId();
      // Create contextual handoff using live conversation (falls back to static demo if insufficient messages)
      createContextualHandoff(newHandoffId, messages);
      setHandoffId(newHandoffId);
    } catch (err) {
      console.error('Failed to create handoff:', err);
    } finally {
      setIsCreatingHandoff(false);
    }
  }, [messages]);

  // Get full agent handoff URL
  const getAgentUrl = useCallback(() => {
    if (!handoffId) return '';
    return `${window.location.origin}/agent/${handoffId}`;
  }, [handoffId]);

  // Copy agent handoff link
  const handleCopyAgentLink = useCallback(() => {
    if (handoffId) {
      navigator.clipboard.writeText(getAgentUrl());
      setHandoffLinkCopied(true);
      setTimeout(() => setHandoffLinkCopied(false), 2000);
    }
  }, [handoffId, getAgentUrl]);

  // Handle ElevenLabs message callback
  const handleMessage = useCallback((message: { role: 'agent' | 'user'; content: string; isFinal?: boolean }) => {
    handleTranscript(message.role, message.content, message.isFinal ?? true);
  }, [handleTranscript]);

  const handleModeChange = useCallback((mode: { mode: 'speaking' | 'listening' }) => {
    setCurrentSpeaker(mode.mode === 'speaking' ? 'agent' : 'user');
  }, []);

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
    onUserSpeech: (transcript: string) => {
      console.log('[LiveDemo] User speech:', transcript);
      handleTranscript('user', transcript, true);
    },
    onAgentSpeech: (transcript: string) => {
      console.log('[LiveDemo] Agent speech:', transcript);
      handleTranscript('agent', transcript, true);
    },
    onModeChange: (mode) => {
      console.log('[LiveDemo] Mode changed:', mode);
      handleModeChange(mode);
      if (mode.mode === 'listening') {
        setCurrentSpeaker('user');
      } else if (mode.mode === 'speaking') {
        setCurrentSpeaker('agent');
      }
    },
    onError: (err) => {
      console.error('ElevenLabs error:', err);
    },
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
                <p className="text-sm opacity-90">
                  {showSampleDemo ? 'Sample workflow walkthrough' : 'Showing live call transcript for judges'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Toggle Sample Demo */}
              <Button
                onClick={() => setShowSampleDemo(!showSampleDemo)}
                variant="ghost"
                className={`${showSampleDemo ? 'bg-white/20' : ''} text-white hover:bg-white/20`}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                {showSampleDemo ? 'Live Mode' : 'Sample Demo'}
              </Button>

              {isConfigured && !showSampleDemo && (
                <>
                  {!isConnected ? (
                    <Button
                      onClick={startCall}
                      disabled={isConnecting || !hasAgentId || !isSdkLoaded}
                      className="bg-white text-aa-blue hover:bg-gray-100"
                      title={
                        !hasAgentId
                          ? 'Agent ID is required. Configure NEXT_PUBLIC_ELEVENLABS_AGENT_ID or ensure ELEVENLABS_AGENT_ID is set on the backend.'
                          : !isSdkLoaded
                          ? 'ElevenLabs SDK is loading. Please wait...'
                          : undefined
                      }
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {isConnecting ? 'Connecting...' : !isSdkLoaded ? 'Loading SDK...' : 'Start Web Call'}
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
          </motion.div>

          {/* Content Area */}
          {showSampleDemo ? (
            /* Sample Workflow Demo - Full Width */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[calc(100vh-280px)]"
            >
              <SampleWorkflowDemo className="h-full" />
            </motion.div>
          ) : (
            /* Split View - Live Mode */
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
          )}

          {/* Family Helper Panel - Only in Live Mode */}
          {!showSampleDemo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Family Helper Demo</h3>
                  <p className="text-sm opacity-90">Generate a link to show family assistance feature</p>
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
                      {linkCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
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
          )}


          {/* Error Display - Only in Live Mode */}
          {!showSampleDemo && error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Instructions for Demo - Only in Live Mode */}
          {!showSampleDemo && !isConfigured && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg"
            >
              <p className="font-semibold">ElevenLabs Conversational AI not configured</p>
              <p className="text-sm mt-1">
                To enable web calls, configure ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in your environment.
                You can still demo by calling the phone number.
              </p>
            </motion.div>
          )}
          {/* Agent Handoff Demo - Only in Live Mode */}
          {!showSampleDemo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl p-4"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Agent Handoff Demo</h3>
                  <p className="text-sm opacity-90">
                    Simulate MeeMaw requesting help with a fee waiver
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!handoffId ? (
                  <Button
                    onClick={handleCreateHandoff}
                    disabled={isCreatingHandoff}
                    className="bg-white text-orange-700 hover:bg-gray-100"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {isCreatingHandoff ? 'Creating...' : 'Simulate Handoff'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCopyAgentLink}
                      className="bg-white/20 hover:bg-white/30"
                      title="Copy agent link"
                    >
                      {handoffLinkCopied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {handoffLinkCopied ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      onClick={() => window.open(getAgentUrl(), '_blank')}
                      className="bg-white text-orange-700 hover:bg-gray-100"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Agent Console
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
