'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getHelperSession,
  sendHelperSuggestion,
  getHelperLocation,
  getIROPStatus,
  helperAcceptRebooking,
  helperAcknowledgeDisruption,
} from '@/lib/api';
import { HelperDashboard, DisruptionAlert } from '@/components/helper';
import {
  DFW_DEMO_RESERVATION,
  DFW_GATE_LOCATION,
  DFW_JOURNEY_WAYPOINTS,
  calculateDistance,
  getWaypointByProgress,
  interpolatePosition,
} from '@/lib/dfwDemoData';
import type { Message, Reservation, HelperLocationResponse, AlertStatus, IROPStatus } from '@/types';

// Dynamically import MapboxLocationMap with SSR disabled (mapbox-gl is client-only)
const MapboxLocationMap = dynamic(
  () => import('@/components/helper/MapboxLocationMap').then((mod) => mod.MapboxLocationMap),
  { ssr: false, loading: () => <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" /> }
);

// Generate DFW demo location data with waypoint-based movement
function generateDFWDemoLocation(progress: number, departureTime: Date): HelperLocationResponse {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  // Get current waypoint and position
  const { current, next, segmentProgress } = getWaypointByProgress(clampedProgress);
  const position = interpolatePosition(current, next, segmentProgress);

  // Calculate distance to gate (for display)
  const distanceMeters = calculateDistance(
    position.lat,
    position.lng,
    DFW_GATE_LOCATION.lat,
    DFW_GATE_LOCATION.lng
  );

  // For demo: use progress-based walking time (total journey is ~10 mins for demo purposes)
  // This gives more realistic times instead of raw distance calculation
  const TOTAL_JOURNEY_MINUTES = 10;
  const remainingProgress = 1 - clampedProgress;
  const walkingTimeMinutes = Math.max(0, Math.ceil(remainingProgress * TOTAL_JOURNEY_MINUTES));

  // Time to departure
  const timeToDepartureMinutes = Math.max(0, Math.floor((departureTime.getTime() - Date.now()) / 60000));

  // Determine alert status
  let alertStatus: AlertStatus = 'safe';
  if (clampedProgress >= 0.98) {
    alertStatus = 'arrived';
  } else if (walkingTimeMinutes > timeToDepartureMinutes - 15) {
    alertStatus = 'urgent';
  } else if (walkingTimeMinutes > timeToDepartureMinutes - 30) {
    alertStatus = 'warning';
  }

  return {
    passenger_location: {
      lat: position.lat,
      lng: position.lng,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    },
    gate_location: DFW_GATE_LOCATION,
    metrics: {
      distance_meters: Math.round(distanceMeters),
      walking_time_minutes: walkingTimeMinutes,
      time_to_departure_minutes: timeToDepartureMinutes,
      alert_status: alertStatus,
    },
    directions: current.instruction,
    message: alertStatus === 'arrived'
      ? 'MeeMaw has arrived at the gate!'
      : `MeeMaw is at ${current.name} - ${Math.round(distanceMeters)}m from Gate B22`,
    alert: alertStatus === 'urgent' ? {
      id: 'dfw-demo-alert-001',
      type: 'running_late',
      message: 'MeeMaw may be running late for her flight!',
      created_at: new Date().toISOString(),
    } : null,
  };
}

export default function HelperPage() {
  const params = useParams();
  const linkId = params.linkId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [locationData, setLocationData] = useState<HelperLocationResponse | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [iropStatus, setIropStatus] = useState<IROPStatus | null>(null);
  const [iropLoading, setIropLoading] = useState(false);

  // Demo location simulation state
  const [demoProgress, setDemoProgress] = useState(0);
  const demoStartTimeRef = useRef<number | null>(null);
  const DEMO_JOURNEY_DURATION_MS = 120000; // 2 minutes to complete the journey in demo

  const fetchSession = useCallback(async () => {
    if (!linkId) {
      setLoading(false);
      return;
    }
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

  const fetchLocation = useCallback(async () => {
    if (!linkId) return;
    try {
      setLocationLoading(true);
      const data = await getHelperLocation(linkId);
      setLocationData(data);
    } catch (err) {
      // Location data is optional, don't show error
      console.log('Location data not available');
    } finally {
      setLocationLoading(false);
    }
  }, [linkId]);

  const fetchIROPStatus = useCallback(async () => {
    if (!linkId) return;
    try {
      const data = await getIROPStatus(linkId);
      setIropStatus(data);
    } catch (err) {
      // IROP status is optional, don't show error
      console.log('IROP status not available');
    }
  }, [linkId]);

  const handleAcceptRebooking = async (optionId: string) => {
    if (!linkId) return;
    try {
      setIropLoading(true);
      await helperAcceptRebooking(linkId, optionId);
      // Refresh session and IROP status after accepting
      await fetchSession();
      await fetchIROPStatus();
    } catch (err) {
      console.error('Failed to accept rebooking:', err);
      setError('Failed to accept rebooking. Please try again.');
    } finally {
      setIropLoading(false);
    }
  };

  const handleAcknowledgeDisruption = async (disruptionId: string) => {
    if (!linkId) return;
    try {
      setIropLoading(true);
      await helperAcknowledgeDisruption(linkId, disruptionId);
      // Refresh IROP status after acknowledging
      await fetchIROPStatus();
    } catch (err) {
      console.error('Failed to acknowledge disruption:', err);
      setError('Failed to acknowledge disruption. Please try again.');
    } finally {
      setIropLoading(false);
    }
  };

  useEffect(() => {
    if (!linkId) return;

    fetchSession();
    fetchIROPStatus();

    // Poll for updates every 3 seconds
    const sessionInterval = setInterval(fetchSession, 3000);
    // Poll location every 5 seconds
    const locationInterval = setInterval(fetchLocation, 5000);
    // Poll IROP status every 10 seconds
    const iropInterval = setInterval(fetchIROPStatus, 10000);

    return () => {
      clearInterval(sessionInterval);
      clearInterval(locationInterval);
      clearInterval(iropInterval);
    };
  }, [linkId, fetchSession, fetchLocation, fetchIROPStatus]);

  // Demo location simulation effect
  useEffect(() => {
    if (!demoMode) {
      // Reset demo when exiting demo mode
      demoStartTimeRef.current = null;
      setDemoProgress(0);
      return;
    }

    // Start the demo journey
    if (demoStartTimeRef.current === null) {
      demoStartTimeRef.current = Date.now();
    }

    // Update demo location every second
    const demoInterval = setInterval(() => {
      if (demoStartTimeRef.current === null) return;

      const elapsed = Date.now() - demoStartTimeRef.current;
      const progress = Math.min(elapsed / DEMO_JOURNEY_DURATION_MS, 1);
      setDemoProgress(progress);

      // Loop the demo after completion (restart after 5 seconds at gate)
      if (progress >= 1) {
        setTimeout(() => {
          demoStartTimeRef.current = Date.now();
          setDemoProgress(0);
        }, 5000);
      }
    }, 1000);

    return () => clearInterval(demoInterval);
  }, [demoMode]);

  // Get current waypoint for display
  const currentWaypoint = demoMode
    ? getWaypointByProgress(demoProgress).current
    : null;

  // Generate demo location data when in demo mode
  const effectiveLocationData = demoMode
    ? generateDFWDemoLocation(demoProgress, new Date(DFW_DEMO_RESERVATION.flights[0].departure_time))
    : locationData;

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
          <div className="bg-purple-100 border border-purple-300 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-800 font-medium">
                DFW Airport Demo - Live Navigation
              </span>
              <button
                onClick={() => setDemoMode(false)}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                Exit Demo
              </button>
            </div>
            <p className="text-purple-700 text-sm">
              Watching MeeMaw navigate from Terminal A to Gate B22 at DFW Airport.
              {demoProgress >= 1 && ' She has arrived! Demo will restart shortly.'}
            </p>
            {currentWaypoint && (
              <div className="mt-2 p-2 bg-purple-200 rounded-lg">
                <p className="text-purple-800 font-medium text-sm">
                  Current Location: {currentWaypoint.name}
                </p>
                <p className="text-purple-700 text-xs">
                  {currentWaypoint.instruction}
                </p>
              </div>
            )}
            <div className="mt-2 bg-purple-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all duration-1000"
                style={{ width: `${demoProgress * 100}%` }}
              />
            </div>
            {/* Waypoint Progress */}
            <div className="mt-3 flex items-center gap-1">
              {DFW_JOURNEY_WAYPOINTS.map((wp, idx) => {
                const waypointProgress = (idx / (DFW_JOURNEY_WAYPOINTS.length - 1));
                const isCompleted = demoProgress > waypointProgress;
                const isCurrent = currentWaypoint?.id === wp.id;
                return (
                  <div
                    key={wp.id}
                    className={`flex-1 h-1.5 rounded-full transition-colors ${
                      isCompleted ? 'bg-purple-600' : isCurrent ? 'bg-purple-400' : 'bg-purple-200'
                    }`}
                    title={wp.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Dashboard with Passenger Info and Flight Status */}
        {(reservation || demoMode) ? (
          <>
            <HelperDashboard reservation={reservation || DFW_DEMO_RESERVATION} />

            {/* IROP Disruption Alert */}
            {iropStatus && iropStatus.has_disruption && (
              <DisruptionAlert
                iropStatus={iropStatus}
                onAcceptRebooking={handleAcceptRebooking}
                onAcknowledgeDisruption={handleAcknowledgeDisruption}
                loading={iropLoading}
              />
            )}

            {/* Location Tracking Map */}
            <MapboxLocationMap
              passengerLocation={effectiveLocationData?.passenger_location ?? null}
              gateLocation={effectiveLocationData?.gate_location ?? null}
              metrics={effectiveLocationData?.metrics ?? null}
              directions={effectiveLocationData?.directions ?? ''}
              message={effectiveLocationData?.message ?? 'Waiting for location updates...'}
              alert={effectiveLocationData?.alert ?? null}
              onRefresh={demoMode ? undefined : fetchLocation}
              loading={demoMode ? false : locationLoading}
              waypoints={demoMode ? DFW_JOURNEY_WAYPOINTS : undefined}
              currentWaypointId={demoMode ? currentWaypoint?.id : undefined}
            />
          </>
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
                Load DFW Demo
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
