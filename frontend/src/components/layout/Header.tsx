'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
  showDemoToggle?: boolean;
  isDemoMode?: boolean;
  onDemoToggle?: () => void;
}

export function Header({ className, showDemoToggle, isDemoMode, onDemoToggle }: HeaderProps) {
  return (
    <header className={cn("bg-aa-blue text-white py-4 px-6 sticky top-0 z-50 shadow-lg", className)}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/about" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer">
          {/* AA Logo/Icon - Clickable to About/Showcase page */}
          <div className="bg-white rounded-full p-2">
            <svg className="w-10 h-10 text-aa-blue" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">American Airlines</h1>
            <p className="text-sm md:text-base opacity-90">Voice Concierge</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {showDemoToggle && (
            <button
              onClick={onDemoToggle}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isDemoMode
                  ? "bg-white text-aa-blue"
                  : "bg-aa-blue/20 text-white border border-white/30 hover:bg-white/10"
              )}
            >
              {isDemoMode ? 'Exit Demo' : 'Demo Mode'}
            </button>
          )}
          <a
            href="tel:+18005551234"
            className="flex items-center gap-2 bg-white text-aa-blue px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span className="hidden md:inline">Call Now</span>
          </a>
        </div>
      </div>
    </header>
  );
}
