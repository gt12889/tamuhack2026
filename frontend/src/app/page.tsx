'use client';

import { useState } from 'react';
import { LandingPage } from '@/components/landing';
import { LiveDemo } from '@/components/demo';

// ElevenLabs AI Agent phone number
const PHONE_NUMBER = '+1 (877) 211-0332';

// ElevenLabs Agent ID for web calls (optional - set via environment variable)
const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export default function Home() {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const handleDemoToggle = () => {
    setIsDemoMode(!isDemoMode);
  };

  if (isDemoMode) {
    return (
      <LiveDemo
        phoneNumber={PHONE_NUMBER}
        agentId={ELEVENLABS_AGENT_ID}
        onExitDemo={handleDemoToggle}
      />
    );
  }

  return (
    <LandingPage
      phoneNumber={PHONE_NUMBER}
      showDemoToggle
      isDemoMode={isDemoMode}
      onDemoToggle={handleDemoToggle}
    />
  );
}
