'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getElevenLabsStatus, getElevenLabsSignedUrl, getElevenLabsTranscript } from '@/lib/api';

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
  onMessage?: (message: { role: 'agent' | 'user'; content: string; isFinal?: boolean }) => void;
  onModeChange?: (mode: { mode: 'speaking' | 'listening' }) => void;
  onError?: (error: string) => void;
  onUserSpeech?: (transcript: string) => void;
  onAgentSpeech?: (transcript: string) => void;
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
  onUserSpeech,
  onAgentSpeech,
}: UseElevenLabsConversationOptions = {}): UseElevenLabsConversationReturn {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultAgentId, setDefaultAgentId] = useState<string | null>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkLoadError, setSdkLoadError] = useState<string | null>(null);

  const conversationRef = useRef<any | null>(null);
  const conversationIdRef = useRef<string | null>(null);

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
      // Get signed URL from backend with explicit language for Scribe Realtime ASR
      // Language defaults to 'en' if not specified (required for Scribe Realtime)
      const signedUrlResponse = await getElevenLabsSignedUrl({
        agent_id: effectiveAgentId,
        session_id: sessionId,
        language: 'en',  // Explicitly set language (required for Scribe Realtime ASR)
      });

      if (!signedUrlResponse.signed_url) {
        throw new Error('Failed to get signed URL from backend');
      }

      const { Conversation } = ElevenLabsModule;

      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation session with Scribe Realtime ASR configuration
      // Note: ASR model and language are configured via the signed URL from backend
      const conversation = await Conversation.startSession({
        signedUrl: signedUrlResponse.signed_url,
        // Enable user transcript forwarding if the SDK supports it
        // Some SDK versions may require this to be enabled
        onConnect: (_props: { conversationId: string }) => {
          console.log('[ElevenLabs] Connected! ConversationId:', _props.conversationId);
          conversationIdRef.current = _props.conversationId;
          setIsConnecting(false);
          setIsConnected(true);
          if (onConnect) onConnect();
        },
        onDisconnect: async (_details: any) => {
          console.log('[ElevenLabs] Disconnected:', _details);
          setIsConnected(false);
          
          // Fetch transcript from backend after call ends (wait a moment for processing)
          if (conversationIdRef.current) {
            const conversationId = conversationIdRef.current;
            // Wait 2 seconds for ElevenLabs to process and store the transcript
            setTimeout(async () => {
              try {
                const transcript = await getElevenLabsTranscript(conversationId);
                if (transcript && transcript.messages) {
                  console.log('[ElevenLabs] Fetched transcript from backend:', transcript);
                  
                  // Process transcript messages and call callbacks
                  for (const msg of transcript.messages) {
                    const role = msg.role === 'user' ? 'user' : 'agent';
                    const content = msg.content || msg.text || '';
                    
                    if (content.trim()) {
                      if (role === 'user' && onUserSpeech) {
                        onUserSpeech(content);
                      } else if (role === 'agent' && onAgentSpeech) {
                        onAgentSpeech(content);
                      }
                      if (onMessage) {
                        onMessage({ role, content });
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn('[ElevenLabs] Failed to fetch transcript:', err);
              }
            }, 2000);
          }
          
          conversationRef.current = null;
          if (onDisconnect) onDisconnect();
        },
        onMessage: (payload: { message?: string; source?: string; role?: string; text?: string; transcript?: string; content?: string; speech?: string; type?: string; speaker?: string; isFinal?: boolean }) => {
          // Log the full payload structure to debug
          console.log('[ElevenLabs] Raw message received:', JSON.stringify(payload, null, 2));
          console.log('[ElevenLabs] Payload keys:', Object.keys(payload));
          
          if (onMessage) {
            // Handle different payload formats from ElevenLabs SDK versions
            // Check all possible fields for message content
            const content = payload.message || payload.text || payload.transcript || payload.content || payload.speech || '';
            let role: 'agent' | 'user' = 'user';
            
            // Determine role from various possible fields - be more aggressive in detection
            if (payload.role === 'agent' || payload.role === 'assistant' || 
                payload.source === 'ai' || payload.source === 'assistant' || 
                payload.speaker === 'agent' || payload.speaker === 'assistant' ||
                payload.type === 'agent_message' || payload.type === 'ai_message' || payload.type === 'assistant_message') {
              role = 'agent';
            } else if (payload.role === 'user' || payload.role === 'human' ||
                       payload.source === 'user' || payload.source === 'human' ||
                       payload.speaker === 'user' || payload.speaker === 'human' ||
                       payload.type === 'user_message' || payload.type === 'user_speech' || payload.type === 'human_message') {
              role = 'user';
            }

            // If we still can't determine role, check if it's from the agent by default
            // (most messages in conversational AI are agent responses)
            if (role === 'user' && !content) {
              // Might be an agent message without explicit role
              role = 'agent';
            }

            // Determine if message is final
            const isFinal = typeof payload.isFinal === 'boolean'
              ? payload.isFinal
              : payload.type
              ? !/partial|interim|delta/i.test(payload.type)
              : true;

            if (content && content.trim()) {
              console.log('[ElevenLabs] Calling onMessage with:', { role, content, isFinal, payloadType: payload.type, payloadRole: payload.role });
              
              // Call specific callbacks if provided
              if (role === 'user' && onUserSpeech) {
                console.log('[ElevenLabs] User speech detected, calling onUserSpeech');
                onUserSpeech(content);
              } else if (role === 'agent' && onAgentSpeech) {
                console.log('[ElevenLabs] Agent speech detected, calling onAgentSpeech');
                onAgentSpeech(content);
              }
              
              // Always call the general onMessage callback
              onMessage({ role, content, isFinal });
            } else {
              console.warn('[ElevenLabs] Message payload has no content:', payload);
            }
          }
        },
        // Try additional callbacks that might exist in the SDK
        // These may not exist in all SDK versions, but we'll try them
        ...(onUserSpeech && {
          onUserTranscript: (transcript: string) => {
            console.log('[ElevenLabs] onUserTranscript callback:', transcript);
            onUserSpeech(transcript);
            if (onMessage) {
              onMessage({ role: 'user', content: transcript });
            }
          },
          onUserSpeech: (transcript: string) => {
            console.log('[ElevenLabs] onUserSpeech callback:', transcript);
            onUserSpeech(transcript);
            if (onMessage) {
              onMessage({ role: 'user', content: transcript });
            }
          },
        }),
        ...(onAgentSpeech && {
          onAgentTranscript: (transcript: string) => {
            console.log('[ElevenLabs] onAgentTranscript callback:', transcript);
            onAgentSpeech(transcript);
            if (onMessage) {
              onMessage({ role: 'agent', content: transcript });
            }
          },
        }),
        onModeChange: (modePayload: { mode: 'speaking' | 'listening' }) => {
          console.log('[ElevenLabs] Mode changed:', modePayload);
          if (onModeChange) onModeChange(modePayload);
          
          // When mode changes to listening, the user might be speaking
          // Try to access transcripts if available on the conversation object
          if (modePayload.mode === 'listening' && conversationRef.current) {
            try {
              // Some SDK versions expose transcript methods
              if (typeof conversationRef.current.getUserTranscript === 'function') {
                const transcript = conversationRef.current.getUserTranscript();
                if (transcript && onUserSpeech) {
                  console.log('[ElevenLabs] Got user transcript from getUserTranscript():', transcript);
                  onUserSpeech(transcript);
                  if (onMessage) {
                    onMessage({ role: 'user', content: transcript });
                  }
                }
              }
            } catch (e) {
              // Method doesn't exist, that's okay
            }
          }
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
      
      // Log available methods on the conversation object for debugging
      console.log('[ElevenLabs] Conversation object methods:', Object.getOwnPropertyNames(conversation));
      console.log('[ElevenLabs] Conversation object prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(conversation)));
      
      // Try to enable user transcript forwarding if the SDK supports it
      try {
        if (typeof conversation.enableUserTranscript === 'function') {
          conversation.enableUserTranscript(true);
          console.log('[ElevenLabs] Enabled user transcript forwarding');
        }
        if (typeof conversation.setUserTranscriptCallback === 'function' && onUserSpeech) {
          conversation.setUserTranscriptCallback((transcript: string) => {
            console.log('[ElevenLabs] User transcript from callback:', transcript);
            onUserSpeech(transcript);
            if (onMessage) {
              onMessage({ role: 'user', content: transcript });
            }
          });
          console.log('[ElevenLabs] Set user transcript callback');
        }
      } catch (e) {
        console.log('[ElevenLabs] User transcript methods not available:', e);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start call';
      setError(errorMsg);
      setIsConnecting(false);
      if (onError) onError(errorMsg);
    }
  }, [agentId, defaultAgentId, sessionId, isSdkLoaded, sdkLoadError, onConnect, onDisconnect, onMessage, onModeChange, onError, onUserSpeech, onAgentSpeech]);

  const endCall = useCallback(async () => {
    const conversationId = conversationIdRef.current;
    
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

    // Fetch transcript from backend after call ends (wait a moment for processing)
    if (conversationId) {
      // Wait 2 seconds for ElevenLabs to process and store the transcript
      setTimeout(async () => {
        try {
          const transcript = await getElevenLabsTranscript(conversationId);
          if (transcript && transcript.messages) {
            console.log('[ElevenLabs] Fetched transcript from backend after call end:', transcript);
            
            // Process transcript messages and call callbacks
            for (const msg of transcript.messages) {
              const role = msg.role === 'user' ? 'user' : 'agent';
              const content = msg.content || msg.text || '';
              
              if (content.trim()) {
                if (role === 'user' && onUserSpeech) {
                  onUserSpeech(content);
                } else if (role === 'agent' && onAgentSpeech) {
                  onAgentSpeech(content);
                }
                if (onMessage) {
                  onMessage({ role, content });
                }
              }
            }
          }
        } catch (err) {
          console.warn('[ElevenLabs] Failed to fetch transcript after call end:', err);
        }
      }, 2000);
      
      conversationIdRef.current = null;
    }

    if (onDisconnect) onDisconnect();
  }, [onDisconnect, onMessage, onUserSpeech, onAgentSpeech]);

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

