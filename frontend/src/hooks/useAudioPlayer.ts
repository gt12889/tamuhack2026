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
    };
  }, [onStart, onEnd, onError]);

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
      }
    }
  }, [onError]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    play,
    stop,
    error,
  };
}
