'use client';

import { useState, useCallback, useEffect } from 'react';
import { VoiceButton } from '@/components/VoiceButton';
import { MessageDisplay } from '@/components/MessageDisplay';
import { FlightCard } from '@/components/FlightCard';
import { ConfirmationScreen } from '@/components/ConfirmationScreen';
import { TextInput } from '@/components/TextInput';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useBrowserTTS } from '@/hooks/useBrowserTTS';
import { startConversation, sendMessage } from '@/lib/api';
import type { Message, VoiceState, Reservation, FlightSegment, ConversationResponse } from '@/types';

type AppState = 'landing' | 'conversation' | 'selecting' | 'confirmed';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [flightOptions, setFlightOptions] = useState<FlightSegment[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { playWithFallback, isPlaying } = useAudioPlayer({
    onStart: () => setVoiceState('speaking'),
    onEnd: () => setVoiceState('idle'),
    onError: (err) => setError(err),
  });

  const handleVoiceResult = useCallback(async (transcript: string) => {
    if (!sessionId) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: transcript,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setVoiceState('processing');

    try {
      const response: ConversationResponse = await sendMessage(sessionId, transcript);

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        audio_url: response.audio_url,
        timestamp: new Date().toISOString(),
        intent: response.intent,
        entities: response.entities,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update state based on response
      if (response.reservation) {
        setReservation(response.reservation);
      }

      if (response.flight_options && response.flight_options.length > 0) {
        setFlightOptions(response.flight_options);
        setAppState('selecting');
      }

      if (response.session_state === 'complete') {
        setAppState('confirmed');
      }

      // Play audio response (with browser TTS fallback)
      await playWithFallback(response.audio_url || null, response.reply);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setVoiceState('idle');
    }
  }, [sessionId, playWithFallback]);

  const {
    isListening,
    isSupported,
    transcript: currentTranscript,
    startListening,
    stopListening,
    error: speechError
  } = useSpeechRecognition({
    onResult: handleVoiceResult,
    onError: (err) => setError(err),
    silenceTimeout: 2000,
  });

  // Update voice state based on listening/playing status
  useEffect(() => {
    if (isListening) {
      setVoiceState('listening');
    } else if (!isPlaying && voiceState === 'listening') {
      setVoiceState('idle');
    }
  }, [isListening, isPlaying, voiceState]);

  const handleStartConversation = async () => {
    try {
      setError(null);
      setVoiceState('processing');

      const response = await startConversation();
      setSessionId(response.session_id);

      const greetingMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.greeting,
        audio_url: response.audio_url,
        timestamp: new Date().toISOString(),
      };
      setMessages([greetingMessage]);
      setAppState('conversation');

      // Play greeting (with browser TTS fallback)
      await playWithFallback(response.audio_url || null, response.greeting);
    } catch (err) {
      setError('Could not connect to the assistant. Please try again.');
      setVoiceState('idle');
    }
  };

  const handleVoiceButtonClick = () => {
    if (appState === 'landing') {
      handleStartConversation();
    } else if (voiceState === 'idle') {
      startListening();
    } else if (voiceState === 'listening') {
      stopListening();
    }
  };

  const handleFlightSelect = async (flightId: string) => {
    setSelectedFlight(flightId);
    // Simulate confirming with voice
    if (sessionId) {
      const selectedFlightInfo = flightOptions.find((f) => f.id === flightId);
      if (selectedFlightInfo) {
        await handleVoiceResult(`Yes, I want the ${selectedFlightInfo.flight_number} flight`);
      }
    }
  };

  const handleStartOver = () => {
    setAppState('landing');
    setVoiceState('idle');
    setSessionId(null);
    setMessages([]);
    setReservation(null);
    setFlightOptions([]);
    setSelectedFlight(null);
    setError(null);
  };

  // Render confirmed state
  if (appState === 'confirmed' && reservation) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <ConfirmationScreen reservation={reservation} onStartOver={handleStartOver} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-aa-blue text-white py-6 px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <div>
              <h1 className="text-heading font-bold">American Airlines</h1>
              <p className="text-body opacity-90">Voice Concierge</p>
            </div>
          </div>
          {sessionId && (
            <button
              onClick={handleStartOver}
              className="text-body underline hover:no-underline"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        {/* Error message */}
        {(error || speechError) && (
          <div className="bg-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-2xl text-body-lg max-w-xl text-center">
            {error || speechError}
          </div>
        )}

        {/* Browser not supported warning */}
        {!isSupported && appState !== 'landing' && (
          <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-800 px-6 py-4 rounded-2xl text-body-lg max-w-xl text-center">
            Your browser doesn't support voice recognition. You can still type your requests.
          </div>
        )}

        {/* Landing state */}
        {appState === 'landing' && (
          <div className="text-center">
            <h2 className="text-display font-bold text-aa-dark mb-4">
              Need help with your flight?
            </h2>
            <p className="text-heading text-gray-600 mb-12 max-w-lg">
              Just talk to me. I can help you change your flight, check your status, and more.
            </p>
            <VoiceButton state={voiceState} onClick={handleVoiceButtonClick} />
          </div>
        )}

        {/* Conversation state */}
        {appState === 'conversation' && (
          <>
            <MessageDisplay
              messages={messages}
              currentTranscript={currentTranscript}
              isListening={isListening}
            />
            <VoiceButton state={voiceState} onClick={handleVoiceButtonClick} />

            {/* Text input fallback */}
            {!isSupported || voiceState === 'idle' ? (
              <TextInput
                onSubmit={handleVoiceResult}
                disabled={voiceState !== 'idle'}
                placeholder="Or type your message here..."
              />
            ) : null}
          </>
        )}

        {/* Flight selection state */}
        {appState === 'selecting' && (
          <>
            <MessageDisplay messages={messages} />

            <div className="w-full max-w-2xl">
              <h2 className="text-heading font-bold text-center mb-6">
                Available Flights
              </h2>
              <div className="space-y-6">
                {flightOptions.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    selected={selectedFlight === flight.id}
                    showSelectButton
                    onSelect={() => handleFlightSelect(flight.id)}
                  />
                ))}
              </div>
            </div>

            <VoiceButton state={voiceState} onClick={handleVoiceButtonClick} />

            <p className="text-body text-gray-500">
              Or say which flight you prefer
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 px-8 text-center">
        <p className="text-body text-gray-600">
          TAMUHack 2026 | Powered by Gemini, ElevenLabs, and Vultr
        </p>
      </footer>
    </main>
  );
}
