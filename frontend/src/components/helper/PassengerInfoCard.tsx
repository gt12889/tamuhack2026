'use client';

import type { Passenger } from '@/types';

interface PassengerInfoCardProps {
  passenger: Passenger;
  confirmationCode: string;
}

export function PassengerInfoCard({ passenger, confirmationCode }: PassengerInfoCardProps) {
  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'es':
        return 'Spanish';
      case 'en':
      default:
        return 'English';
    }
  };

  const getSeatPreferenceLabel = (pref?: string) => {
    switch (pref) {
      case 'window':
        return 'Window';
      case 'aisle':
        return 'Aisle';
      case 'middle':
        return 'Middle';
      default:
        return 'No preference';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header with avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {passenger.first_name} {passenger.last_name}
          </h2>
          <p className="text-sm text-gray-500">Passenger Information</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="space-y-4">
        {/* Confirmation Code - prominent */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Confirmation Code</span>
          <p className="text-2xl font-bold text-purple-800 mt-1">{confirmationCode}</p>
        </div>

        {/* AAdvantage Number */}
        {passenger.aadvantage_number && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-aa-blue/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-aa-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">AAdvantage #</span>
              <span className="font-medium text-gray-800">{passenger.aadvantage_number}</span>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-gray-500 block">Email</span>
            <span className="font-medium text-gray-800 truncate block">{passenger.email}</span>
          </div>
        </div>

        {/* Phone */}
        {passenger.phone && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Phone</span>
              <span className="font-medium text-gray-800">{passenger.phone}</span>
            </div>
          </div>
        )}

        {/* Preferences section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Preferences</h3>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              {getSeatPreferenceLabel(passenger.preferences?.seat_preference)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {getLanguageLabel(passenger.preferences?.language || 'en')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
