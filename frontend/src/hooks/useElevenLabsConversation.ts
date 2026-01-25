'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getElevenLabsStatus, getElevenLabsSignedUrl } from '@/lib/api';

// Dynamic import for ElevenLabs client SDK
let ElevenLabsModule: any = null;
let sdkLoadPromise: Promise<any> | null = null;

async function loadElevenLabsSDK() {
  if (ElevenLabsModule) {
    return ElevenLabsModule;
  }

  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }

  sdkLoadPromise = import('@elevenlabs/client').then((module) => {
    ElevenLabsModule = module;
    return module;
  }).catch((error) => {
    sdkLoadPromise = null;
    throw error;
  });

  return sdkLoadPromise;
}

interface UseElevenLabsConversationOptions {
  agentId?: string;
  sessionId?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: { role: 'agent' | 'user'; content: string }) => void;
  onModeChange?: (mode: { mode: 'speaking' | 'listening' }) => void;
  onError?: (error: string) => void;
}

interface UseElevenLabsConversationReturn {
  isConfigured: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  error: string | null;
  hasAgentId: boolean;
  isSdkLoaded: boolean;
}

export function useElevenLabsConversation({
  agentId,
  sessionId,
  onConnect,
  onDisconnect,
  onMessage,
  onModeChange,
  onError,
}: UseElevenLabsConversationOptions = {}): UseElevenLabsConversationReturn {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkLoadError, setSdkLoadError] = useState<string | null>(null);

  const conversationRef = useRef<any | null>(null);

  // Check if ElevenLabs is configured on mount and get agent ID
  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getElevenLabsStatus();
        setIsConfigured(status.configured);
        if (status.agent_id) {
          setDefaultAgentId(status.agent_id);
        }
      } catch (err) {
        setIsConfigured(false);
      }
    }
    checkStatus();
  }, []);

  // Preload ElevenLabs SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Try to load the SDK in the background
    loadElevenLabsSDK()
      .then(() => {
        setIsSdkLoaded(true);
        setSdkLoadError(null);
        console.log('ElevenLabs SDK loaded successfully');
      })
      .catch((err) => {
        const errorMsg = `Failed to load ElevenLabs SDK: ${err.message || 'Unknown error'}`;
        console.error('Failed to load ElevenLabs SDK:', err);
        setSdkLoadError(errorMsg);
        setError(errorMsg);
        if (onError) onError(errorMsg);
      });
  }, [onError]);

  const startCall = useCallback(async () => {
    // Use provided agentId or fall back to default from status
    const effectiveAgentId = agentId || defaultAgentId;

    if (!effectiveAgentId) {
      const errorMsg = 'Agent ID is required to start a call. Please configure NEXT_PUBLIC_ELEVENLABS_AGENT_ID or ensure ELEVENLABS_AGENT_ID is set on the backend.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Ensure SDK is loaded
    if (!isSdkLoaded) {
      // Check if there was a load error
      if (sdkLoadError) {
        setError(sdkLoadError);
        if (onError) onError(sdkLoadError);
        return;
      }

      // Try to load the SDK now
      try {
        await loadElevenLabsSDK();
        setIsSdkLoaded(true);
        setSdkLoadError(null);
      } catch (err) {
        const errorMsg = `Failed to load ElevenLabs SDK: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }
    }

    // Get the Conversation class from the loaded module
    if (!ElevenLabsModule || !ElevenLabsModule.Conversation) {
      const errorMsg = 'ElevenLabs SDK not properly loaded. Please refresh the page and try again.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Get signed URL from backend
      const signedUrlResponse = await getElevenLabsSignedUrl({
        agent_id: effectiveAgentId,
        session_id: sessionId,
      });

      if (!signedUrlResponse.signed_url) {
        throw new Error('Failed to get signed URL from backend');
      }

      const { Conversation } = ElevenLabsModule;

      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation session with correct callback signatures
      const conversation = await Conversation.startSession({
        signedUrl: signedUrlResponse.signed_url,
        onConnect: (_props: { conversationId: string }) => {
          console.log('[ElevenLabs] Connected! ConversationId:', _props.conversationId);
          setIsConnecting(false);
          setIsConnected(true);
          if (onConnect) onConnect();
        },
        onDisconnect: (_details: any) => {
          setIsConnected(false);
          conversationRef.current = null;
          if (onDisconnect) onDisconnect();
        },
        onMessage: (payload: { message?: string; source?: string; role?: string; text?: string; type?: string }) => {
          console.log('[ElevenLabs] Raw message received:', JSON.stringify(payload, null, 2));
          if (onMessage) {
            // Handle different payload formats from ElevenLabs SDK versions
            // Newer: { role: 'user'|'agent', message: string }
            // Older: { source: 'user'|'ai', message: string }
            // Some versions: { text: string, type: string }
            const content = payload.message || payload.text || '';
            const role = payload.role === 'agent' || payload.source === 'ai' ? 'agent' : 'user';

            if (content) {
              console.log('[ElevenLabs] Calling onMessage with:', { role, content });
              onMessage({ role, content });
            }
          }
        },
        onModeChange: (modePayload: { mode: 'speaking' | 'listening' }) => {
          if (onModeChange) onModeChange(modePayload);
        },
        onStatusChange: (statusPayload: { status: string }) => {
          // Update connection state based on status
          if (statusPayload.status === 'connected') {
            setIsConnected(true);
            setIsConnecting(false);
          } else if (statusPayload.status === 'connecting') {
            setIsConnecting(true);
          } else if (statusPayload.status === 'disconnected') {
            setIsConnected(false);
            setIsConnecting(false);
          }
        },
        onError: (message: string, _context?: any) => {
          setError(message);
          setIsConnecting(false);
          setIsConnected(false);
          if (onError) onError(message);
        },
      });

      conversationRef.current = conversation;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start call';
      setError(errorMsg);
      setIsConnecting(false);
      if (onError) onError(errorMsg);
    }
  }, [agentId, defaultAgentId, sessionId, isSdkLoaded, sdkLoadError, onConnect, onDisconnect, onMessage, onModeChange, onError]);

  const endCall = useCallback(async () => {
    // End the conversation session
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (err) {
        console.warn('Failed to end conversation session:', err);
      }
      conversationRef.current = null;
    }

    setIsConnected(false);

    if (onDisconnect) onDisconnect();
  }, [onDisconnect]);

  // Check if we have an agent ID available (from prop or default)
  const hasAgentId = !!(agentId || defaultAgentId);

  return {
    isConfigured,
    isConnecting,
    isConnected,
    startCall,
    endCall,
    error,
    hasAgentId,
    isSdkLoaded,
  };
}
