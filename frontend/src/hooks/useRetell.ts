'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createRetellWebCall, endRetellCall, getRetellStatus } from '@/lib/api';
import type { RetellWebCall } from '@/types';

interface UseRetellOptions {
  agentId?: string;
  sessionId?: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onTranscript?: (role: 'agent' | 'user', text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseRetellReturn {
  isConfigured: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  callId: string | null;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  error: string | null;
}

declare global {
  interface Window {
    RetellWebClient?: new () => RetellWebClientInstance;
  }
}

interface RetellWebClientInstance {
  startCall: (config: {
    accessToken: string;
    sampleRate?: number;
    captureDeviceId?: string;
  }) => Promise<void>;
  stopCall: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

export function useRetell({
  agentId,
  sessionId,
  onCallStart,
  onCallEnd,
  onTranscript,
  onError,
}: UseRetellOptions = {}): UseRetellReturn {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const webClientRef = useRef<RetellWebClientInstance | null>(null);
  const callDataRef = useRef<RetellWebCall | null>(null);

  // Check if Retell is configured on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getRetellStatus();
        setIsConfigured(status.configured);
      } catch (err) {
        setIsConfigured(false);
      }
    }
    checkStatus();
  }, []);

  // Load Retell Web SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.RetellWebClient) return;

    // Load the SDK dynamically
    const script = document.createElement('script');
    script.src = 'https://sdk.retellai.com/retell-web-sdk.js';
    script.async = true;
    script.onload = () => {
      console.log('Retell Web SDK loaded');
    };
    script.onerror = () => {
      console.error('Failed to load Retell Web SDK');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (webClientRef.current && isConnected) {
        webClientRef.current.stopCall();
      }
    };
  }, [isConnected]);

  const startCall = useCallback(async () => {
    if (!agentId) {
      const errorMsg = 'Agent ID is required to start a call';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    if (!window.RetellWebClient) {
      const errorMsg = 'Retell SDK not loaded';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create web call on backend
      const webCall = await createRetellWebCall({
        agent_id: agentId,
        session_id: sessionId,
      });

      callDataRef.current = webCall;
      setCallId(webCall.call_id);

      // Initialize Retell Web Client
      const webClient = new window.RetellWebClient();
      webClientRef.current = webClient;

      // Set up event handlers
      webClient.on('call_started', () => {
        setIsConnecting(false);
        setIsConnected(true);
        if (onCallStart) onCallStart();
      });

      webClient.on('call_ended', () => {
        setIsConnected(false);
        setCallId(null);
        webClientRef.current = null;
        callDataRef.current = null;
        if (onCallEnd) onCallEnd();
      });

      webClient.on('agent_start_talking', () => {
        // Agent started speaking
      });

      webClient.on('agent_stop_talking', () => {
        // Agent stopped speaking
      });

      webClient.on('update', (update: unknown) => {
        // Handle transcript updates
        const typedUpdate = update as { transcript?: Array<{ role: string; content: string; isFinal: boolean }> };
        if (typedUpdate.transcript && onTranscript) {
          const latest = typedUpdate.transcript[typedUpdate.transcript.length - 1];
          if (latest) {
            onTranscript(
              latest.role as 'agent' | 'user',
              latest.content,
              latest.isFinal
            );
          }
        }
      });

      webClient.on('error', (err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : 'Call error occurred';
        setError(errorMsg);
        setIsConnecting(false);
        setIsConnected(false);
        if (onError) onError(errorMsg);
      });

      // Start the call with the access token
      await webClient.startCall({
        accessToken: webCall.access_token,
        sampleRate: 24000,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start call';
      setError(errorMsg);
      setIsConnecting(false);
      if (onError) onError(errorMsg);
    }
  }, [agentId, sessionId, onCallStart, onCallEnd, onTranscript, onError]);

  const endCall = useCallback(async () => {
    // Stop local client
    if (webClientRef.current) {
      webClientRef.current.stopCall();
      webClientRef.current = null;
    }

    // End call on server
    if (callId) {
      try {
        await endRetellCall(callId);
      } catch (err) {
        console.warn('Failed to end call on server:', err);
      }
    }

    setIsConnected(false);
    setCallId(null);
    callDataRef.current = null;

    if (onCallEnd) onCallEnd();
  }, [callId, onCallEnd]);

  return {
    isConfigured,
    isConnecting,
    isConnected,
    callId,
    startCall,
    endCall,
    error,
  };
}
