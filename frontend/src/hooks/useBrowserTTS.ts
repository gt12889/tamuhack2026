'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseBrowserTTSOptions {
  rate?: number;  // Speaking rate (0.1 to 10, default 0.9 for elderly users)
  pitch?: number; // Pitch (0 to 2, default 1)
  volume?: number; // Volume (0 to 1, default 1)
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseBrowserTTSReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  stop: () => void;
  error: string | null;
}

export function useBrowserTTS({
  rate = 0.9,  // Slightly slower for elderly users
  pitch = 1,
  volume = 1,
  onStart,
  onEnd,
  onError,
}: UseBrowserTTSOptions = {}): UseBrowserTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      const errorMsg = 'Text-to-speech is not supported in this browser';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setError(null);
      onStart?.();
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      const errorMsg = `Speech error: ${event.error}`;
      setError(errorMsg);
      setIsSpeaking(false);
      onError?.(errorMsg);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, rate, pitch, volume, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    error,
  };
}
