'use client';

import Link from 'next/link';
import { Phone, Plane } from 'lucide-react';
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
          {/* AA Logo/Icon - Clickable to About/Landing page */}
          <div className="bg-white rounded-full p-2">
            <Plane className="w-8 h-8 text-aa-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AA Voice Concierge</h1>
            <p className="text-sm opacity-90">TAMUHack 2026</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
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
            href="tel:+18772110332"
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
