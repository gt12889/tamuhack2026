'use client';

import { VoiceState } from '@/types';

interface VoiceButtonProps {
  state: VoiceState;
  onClick: () => void;
  disabled?: boolean;
}

export function VoiceButton({ state, onClick, disabled }: VoiceButtonProps) {
  const getButtonContent = () => {
    switch (state) {
      case 'listening':
        return (
          <>
            <div className="absolute inset-0 bg-aa-red rounded-full animate-pulse-ring" />
            <MicrophoneIcon className="w-16 h-16 text-white relative z-10" />
            <span className="sr-only">Listening...</span>
          </>
        );
      case 'processing':
        return (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent" />
            <span className="sr-only">Processing...</span>
          </>
        );
      case 'speaking':
        return (
          <>
            <SpeakerIcon className="w-16 h-16 text-white animate-pulse" />
            <span className="sr-only">Speaking...</span>
          </>
        );
      default:
        return (
          <>
            <MicrophoneIcon className="w-16 h-16 text-white" />
            <span className="mt-4 text-white text-body-lg font-bold">Talk to Elder Strolls</span>
          </>
        );
    }
  };

  const getButtonStyle = () => {
    const baseStyle = 'relative flex flex-col items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300';

    switch (state) {
      case 'listening':
        return `${baseStyle} w-48 h-48 bg-aa-red shadow-2xl`;
      case 'processing':
        return `${baseStyle} w-48 h-48 bg-aa-blue shadow-xl`;
      case 'speaking':
        return `${baseStyle} w-48 h-48 bg-green-600 shadow-xl`;
      default:
        return `${baseStyle} w-64 h-64 bg-aa-blue hover:bg-blue-700 active:bg-blue-800 shadow-2xl hover:shadow-3xl`;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'listening':
        return "I'm listening...";
      case 'processing':
        return 'Let me think...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Tap to speak';
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={onClick}
        disabled={disabled || state === 'processing' || state === 'speaking'}
        className={getButtonStyle()}
        aria-label={state === 'idle' ? 'Start talking to Elder Strolls assistant' : getStatusText()}
      >
        {getButtonContent()}
      </button>
      <p className="text-heading text-aa-dark font-medium" aria-live="polite">
        {getStatusText()}
      </p>
    </div>
  );
}

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  );
}
