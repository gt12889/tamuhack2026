'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAudioPlayerOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  play: (audioUrl: string) => Promise<void>;
  playWithFallback: (audioUrl: string | null, text: string) => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useAudioPlayer({
  onStart,
  onEnd,
  onError,
}: UseAudioPlayerOptions = {}): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if browser TTS is supported
  const isTTSSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    // Create audio element on mount
    audioRef.current = new Audio();

    audioRef.current.onplay = () => {
      setIsPlaying(true);
      if (onStart) {
        onStart();
      }
    };

    audioRef.current.onended = () => {
      setIsPlaying(false);
      if (onEnd) {
        onEnd();
      }
    };

    audioRef.current.onerror = () => {
      const errorMessage = 'Failed to play audio';
      setError(errorMessage);
      setIsPlaying(false);
      if (onError) {
        onError(errorMessage);
      }
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Clean up speech synthesis
      if (utteranceRef.current && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onStart, onEnd, onError]);

  // Browser TTS fallback function
  const speakWithBrowserTTS = useCallback((text: string) => {
    if (!isTTSSupported) {
      const errorMessage = 'Browser text-to-speech is not supported';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return;
    }

    try {
      // Cancel any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for elderly users
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => {
        setIsPlaying(true);
        if (onStart) {
          onStart();
        }
      };

      utterance.onend = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
        if (onEnd) {
          onEnd();
        }
      };

      utterance.onerror = (event) => {
        const errorMessage = 'Failed to speak text';
        setError(errorMessage);
        setIsPlaying(false);
        utteranceRef.current = null;
        if (onError) {
          onError(errorMessage);
        }
      };

      utteranceRef.current = utterance;
      if (window.speechSynthesis) {
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      const errorMessage = 'Could not use text-to-speech';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [isTTSSupported, onStart, onEnd, onError]);

  const play = useCallback(async (audioUrl: string) => {
    if (audioRef.current) {
      try {
        setError(null);
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      } catch (err) {
        const errorMessage = 'Could not play audio. Please check your speakers.';
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
        throw err; // Re-throw so playWithFallback can catch it
      }
    }
  }, [onError]);

  // New method: Try ElevenLabs audio first, fallback to browser TTS
  const playWithFallback = useCallback(async (audioUrl: string | null, text: string) => {
    // Try ElevenLabs audio first if URL is provided
    if (audioUrl) {
      try {
        await play(audioUrl);
        return; // Success, no fallback needed
      } catch (err) {
        // Audio failed, fall back to browser TTS
        console.warn('ElevenLabs audio failed, using browser TTS fallback:', err);
      }
    }

    // Fallback to browser TTS
    if (text) {
      speakWithBrowserTTS(text);
    } else {
      const errorMessage = 'No audio URL or text provided';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [play, speakWithBrowserTTS, onError]);

  const stop = useCallback(() => {
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    // Stop speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      utteranceRef.current = null;
    }
  }, []);

  return {
    isPlaying,
    play,
    playWithFallback,
    stop,
    error,
  };
}
