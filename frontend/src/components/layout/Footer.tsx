'use client';

import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("bg-gray-100 border-t border-gray-200 py-8 px-6", className)}>
      <div className="max-w-6xl mx-auto">
        {/* Sponsor/Tech Logos */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
          <span className="text-sm text-gray-500 font-medium">Powered by</span>
          <div className="flex items-center gap-8">
            {/* Gemini */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15z" />
              </svg>
              <span className="font-semibold">Gemini</span>
            </div>
            {/* ElevenLabs */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="4" height="16" rx="1" />
                <rect x="10" y="8" width="4" height="8" rx="1" />
                <rect x="16" y="6" width="4" height="12" rx="1" />
              </svg>
              <span className="font-semibold">ElevenLabs</span>
            </div>
            {/* Vultr */}
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 19h20L12 2zm0 4l6.5 11h-13L12 6z" />
              </svg>
              <span className="font-semibold">Vultr</span>
            </div>
          </div>
        </div>

        {/* Hackathon Credit */}
        <div className="text-center text-sm text-gray-500">
          <p>TAMUHack 2026 Project</p>
          <p className="mt-1">Built with AI for a better travel experience</p>
        </div>
      </div>
    </footer>
  );
}
