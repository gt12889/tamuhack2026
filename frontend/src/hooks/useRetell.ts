'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createRetellWebCall, endRetellCall, getRetellStatus } from '@/lib/api';
import type { RetellWebCall } from '@/types';

// Dynamic import for Retell Web SDK
let RetellWebClientModule: any = null;
let sdkLoadPromise: Promise<any> | null = null;

async function loadRetellSDK() {
  if (RetellWebClientModule) {
    return RetellWebClientModule;
  }
  
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }
  
  sdkLoadPromise = import('retell-client-js-sdk').then((module) => {
    RetellWebClientModule = module;
    return module;
  }).catch((error) => {
    sdkLoadPromise = null;
    throw error;
  });
  
  return sdkLoadPromise;
}

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

  // Preload Retell Web SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Try to load the SDK in the background
    loadRetellSDK()
      .then(() => {
        setIsSdkLoaded(true);
        setSdkLoadError(null);
        console.log('Retell Web SDK loaded successfully');
      })
      .catch((err) => {
        const errorMsg = `Failed to load Retell Web SDK: ${err.message || 'Unknown error'}`;
        console.error('Failed to load Retell Web SDK:', err);
        setSdkLoadError(errorMsg);
        setError(errorMsg);
        if (onError) onError(errorMsg);
      });
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
        await loadRetellSDK();
        setIsSdkLoaded(true);
        setSdkLoadError(null);
      } catch (err) {
        const errorMsg = `Failed to load Retell Web SDK: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }
    }

    // Get the RetellWebClient class from the loaded module
    if (!RetellWebClientModule || !RetellWebClientModule.RetellWebClient) {
      const errorMsg = 'Retell SDK not properly loaded. Please refresh the page and try again.';
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
      const { RetellWebClient } = RetellWebClientModule;
      const webClient = new RetellWebClient();
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
