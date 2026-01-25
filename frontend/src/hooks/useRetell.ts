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
  hasAgentId: boolean;
  isSdkLoaded: boolean;
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
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkLoadError, setSdkLoadError] = useState<string | null>(null);

  const webClientRef = useRef<RetellWebClientInstance | null>(null);
  const callDataRef = useRef<RetellWebCall | null>(null);
  const scriptLoadedRef = useRef(false);

  // Check if Retell is configured on mount and get default agent ID
  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getRetellStatus();
        setIsConfigured(status.configured);
        if (status.default_agent_id) {
          setDefaultAgentId(status.default_agent_id);
        }
      } catch (err) {
        setIsConfigured(false);
      }
    }
    checkStatus();
  }, []);

  // Load Retell Web SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (scriptLoadedRef.current) return;

    // Check if already loaded
    if (window.RetellWebClient) {
      setIsSdkLoaded(true);
      scriptLoadedRef.current = true;
      return;
    }

    // Load the SDK dynamically
    const script = document.createElement('script');
    script.src = 'https://sdk.retellai.com/retell-web-sdk.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Retell Web SDK loaded');
      // Double-check it's actually available
      if (window.RetellWebClient) {
        setIsSdkLoaded(true);
        setSdkLoadError(null);
      } else {
        const errorMsg = 'Retell SDK script loaded but RetellWebClient is not available';
        setSdkLoadError(errorMsg);
        setError(errorMsg);
        console.error(errorMsg);
      }
    };
    
    script.onerror = () => {
      const errorMsg = 'Failed to load Retell Web SDK. Please check your internet connection and try again.';
      console.error('Failed to load Retell Web SDK');
      setSdkLoadError(errorMsg);
      setError(errorMsg);
      if (onError) onError(errorMsg);
    };
    
    document.body.appendChild(script);
    scriptLoadedRef.current = true;

    // Cleanup function
    return () => {
      // Only cleanup if component unmounts, not on every render
    };
  }, [onError]);

  const startCall = useCallback(async () => {
    // Use provided agentId or fall back to default from status
    const effectiveAgentId = agentId || defaultAgentId;
    
    if (!effectiveAgentId) {
      const errorMsg = 'Agent ID is required to start a call. Please configure NEXT_PUBLIC_RETELL_AGENT_ID or ensure at least one agent exists in Retell.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    // Wait for SDK to load if it's not loaded yet
    if (!window.RetellWebClient && !isSdkLoaded) {
      // Check if there was a load error
      if (sdkLoadError) {
        setError(sdkLoadError);
        if (onError) onError(sdkLoadError);
        return;
      }
      
      // Wait up to 5 seconds for SDK to load
      let attempts = 0;
      const maxAttempts = 50; // 50 attempts * 100ms = 5 seconds
      
      while (!window.RetellWebClient && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.RetellWebClient) {
        const errorMsg = 'Retell SDK is still loading. Please wait a moment and try again.';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }
      
      setIsSdkLoaded(true);
    }

    if (!window.RetellWebClient) {
      const errorMsg = 'Retell SDK not loaded. Please refresh the page and try again.';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create web call on backend
      const effectiveAgentId = agentId || defaultAgentId;
      const webCall = await createRetellWebCall({
        agent_id: effectiveAgentId!,
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
  }, [agentId, defaultAgentId, sessionId, isSdkLoaded, sdkLoadError, onCallStart, onCallEnd, onTranscript, onError]);

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

  // Check if we have an agent ID available (from prop or default)
  const hasAgentId = !!(agentId || defaultAgentId);

  return {
    isConfigured,
    isConnecting,
    isConnected,
    callId,
    startCall,
    endCall,
    error,
    hasAgentId,
    isSdkLoaded,
  };
}
