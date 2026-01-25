'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getHelperSession, sendHelperSuggestion } from '@/lib/api';
import { HelperDashboard } from '@/components/helper';
import type { Message, Reservation } from '@/types';

// Demo reservation data for testing the dashboard
const DEMO_RESERVATION: Reservation = {
  id: 'demo-res-001',
  confirmation_code: 'DEMO123',
  passenger: {
    id: 'demo-pax-001',
    first_name: 'Margaret',
    last_name: 'Johnson',
    email: 'margaret.johnson@email.com',
    phone: '(555) 123-4567',
    aadvantage_number: '1234567890',
    preferences: {
      language: 'en',
      seat_preference: 'window',
    },
  },
  flights: [
    {
      id: 'demo-flight-001',
      flight_number: 'AA1234',
      origin: 'DFW',
      destination: 'ORD',
      departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      arrival_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
      gate: 'B22',
      status: 'scheduled',
      seat: '14A',
    },
  ],
  status: 'confirmed',
  created_at: new Date().toISOString(),
};

export default function HelperPage() {
  const params = useParams();
  const linkId = params.code as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getHelperSession(linkId);
      setMessages(data.messages as Message[]);
      setReservation(data.reservation);
      // Auto-disable demo mode when real data arrives
      if (data.reservation) {
        setDemoMode(false);
      }
      setError(null);
    } catch (err) {
      setError('This helper link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    fetchSession();
    console.log(params)
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim() || sending) return;

    setSending(true);
    try {
      await sendHelperSuggestion(linkId, suggestion);
      setSuggestion('');
      await fetchSession();
    } catch (err) {
      setError('Failed to send suggestion. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-aa-blue border-t-transparent mx-auto mb-4" />
          <p className="text-body-lg text-gray-600">Loading session...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-heading font-bold text-gray-800 mb-4">{error}</h1>
          <p className="text-body text-gray-600">
            Please ask your family member to share a new link.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-600 text-white py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <h1 className="text-lg font-bold">Family Helper View</h1>
              <p className="text-sm opacity-90">Help your family member with their flight</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Demo Mode Banner */}
        {demoMode && !reservation && (
          <div className="bg-purple-100 border border-purple-300 rounded-xl p-3 flex items-center justify-between">
            <span className="text-purple-800 text-sm font-medium">
              Viewing demo data. Real data will appear when your family member looks up their reservation.
            </span>
            <button
              onClick={() => setDemoMode(false)}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium"
            >
              Hide Demo
            </button>
          </div>
        )}

        {/* Dashboard with Passenger Info and Flight Status */}
        {(reservation || demoMode) ? (
          <HelperDashboard reservation={reservation || DEMO_RESERVATION} />
        ) : (
          <section className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-yellow-800">Waiting for Reservation</h2>
              </div>
              <button
                onClick={() => setDemoMode(true)}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
              >
                Load Demo Data
              </button>
            </div>
            <p className="text-yellow-700">
              Your family member hasn't looked up their reservation yet. Once they provide their
              confirmation code (like <span className="font-mono font-bold">DEMO123</span>),
              you'll see their flight details here.
            </p>
          </section>
        )}

        {/* Conversation */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Conversation</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No messages yet. The conversation will appear here once your family member starts talking.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-gray-100 ml-8'
                      : msg.role === 'family'
                      ? 'bg-purple-100 mr-8 border-2 border-purple-300'
                      : 'bg-aa-blue text-white mr-8'
                  }`}
                >
                  <p className="text-sm font-medium mb-1 opacity-70">
                    {msg.role === 'user' ? 'Your family member' : msg.role === 'family' ? 'You suggested' : 'AA Assistant'}
                  </p>
                  <p className="text-base">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Send Suggestion */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Send a Suggestion</h2>
          <p className="text-sm text-gray-600 mb-4">
            Your message will be read aloud to your family member by the assistant.
          </p>
          <form onSubmit={handleSendSuggestion} className="flex gap-4">
            <input
              type="text"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Type your suggestion here..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !suggestion.trim()}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </section>

        {/* Instructions */}
        <section className="bg-purple-50 rounded-2xl p-6 border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2">How to Help</h3>
          <ul className="text-sm text-purple-700 space-y-2">
            <li>Watch the conversation above to see what they're trying to do</li>
            <li>Send suggestions that will be read aloud to them</li>
            <li>Your family member must confirm any changes themselves</li>
            <li>This page updates automatically every few seconds</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
