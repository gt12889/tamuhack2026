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
  DFW_GATE_LOCATION,
  DFW_JOURNEY_WAYPOINTS,
  calculateDistance,
  getWaypointByProgress,
  interpolatePosition,
} from '@/lib/dfwDemoData';
import {
  createHelperDemoHandoff,
  getHelperDemoHandoff,
  isHelperHandoffActive,
  updateDemoHandoffStatus,
  resetHelperDemoHandoff,
} from '@/lib/handoffDemoData';
import { DEMO_SCENARIOS, scenarioToReservation } from '@/lib/demoScenarios';
import { DemoTranscript } from '@/components/demo/DemoTranscript';
import type { Message, Reservation, HelperLocationResponse, AlertStatus, IROPStatus, HandoffDossier } from '@/types';

// Dynamically import MapboxLocationMap with SSR disabled (mapbox-gl is client-only)
const MapboxLocationMap = dynamic(
  () => import('@/components/helper/MapboxLocationMap').then((mod) => mod.MapboxLocationMap),
  { ssr: false, loading: () => <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" /> }
);

// Generate DFW demo location data with waypoint-based movement
function generateDFWDemoLocation(
  progress: number,
  departureTime: Date,
  passengerName: string = 'MeeMaw',
  gate: string = 'B22'
): HelperLocationResponse {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const { current, next, segmentProgress } = getWaypointByProgress(clampedProgress);
  const position = interpolatePosition(current, next, segmentProgress);
  const distanceMeters = calculateDistance(position.lat, position.lng, DFW_GATE_LOCATION.lat, DFW_GATE_LOCATION.lng);

  const TOTAL_JOURNEY_MINUTES = 10;
  const remainingProgress = 1 - clampedProgress;
  const walkingTimeMinutes = Math.max(0, Math.ceil(remainingProgress * TOTAL_JOURNEY_MINUTES));
  const timeToDepartureMinutes = Math.max(0, Math.floor((departureTime.getTime() - Date.now()) / 60000));

  let alertStatus: AlertStatus = 'safe';
  if (clampedProgress >= 0.98) alertStatus = 'arrived';
  else if (walkingTimeMinutes > timeToDepartureMinutes - 15) alertStatus = 'urgent';
  else if (walkingTimeMinutes > timeToDepartureMinutes - 30) alertStatus = 'warning';

  return {
    passenger_location: { lat: position.lat, lng: position.lng, accuracy: 10, timestamp: new Date().toISOString() },
    gate_location: DFW_GATE_LOCATION,
    metrics: { distance_meters: Math.round(distanceMeters), walking_time_minutes: walkingTimeMinutes, time_to_departure_minutes: timeToDepartureMinutes, alert_status: alertStatus },
    directions: current.instruction,
    message: alertStatus === 'arrived' ? `${passengerName} has arrived at the gate!` : `${passengerName} is at ${current.name} - ${Math.round(distanceMeters)}m from Gate ${gate}`,
    alert: alertStatus === 'urgent' ? { id: 'dfw-demo-alert-001', type: 'running_late', message: `${passengerName} may be running late for their flight!`, created_at: new Date().toISOString() } : null,
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

  // Demo state
  const [demoHandoff, setDemoHandoff] = useState<HandoffDossier | null>(null);
  const [handoffTriggered, setHandoffTriggered] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0]);
  const [transcriptPlaying, setTranscriptPlaying] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const demoStartTimeRef = useRef<number | null>(null);
  const DEMO_JOURNEY_DURATION_MS = 120000;

  // Auto-enable demo mode for demo links
  useEffect(() => {
    if (linkId && linkId.startsWith('demo')) {
      setDemoMode(true);
      setLoading(false);
    }
  }, [linkId]);

  const fetchSession = useCallback(async () => {
    if (!linkId || linkId.startsWith('demo')) {
      setLoading(false);
      return;
    }
    try {
      const data = await getHelperSession(linkId);
      setMessages(data.messages as Message[]);
      setReservation(data.reservation);
      if (data.reservation) setDemoMode(false);
      setError(null);
    } catch {
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
    } catch {
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
    } catch {
      console.log('IROP status not available');
    }
  }, [linkId]);

  const handleAcceptRebooking = async (optionId: string) => {
    if (!linkId) return;
    try {
      setIropLoading(true);
      await helperAcceptRebooking(linkId, optionId);
      await fetchSession();
      await fetchIROPStatus();
    } catch {
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
      await fetchIROPStatus();
    } catch {
      setError('Failed to acknowledge disruption. Please try again.');
    } finally {
      setIropLoading(false);
    }
  };

  useEffect(() => {
    if (!linkId) return;
    fetchSession();
    fetchIROPStatus();
    const sessionInterval = setInterval(fetchSession, 3000);
    const locationInterval = setInterval(fetchLocation, 5000);
    const iropInterval = setInterval(fetchIROPStatus, 10000);
    return () => {
      clearInterval(sessionInterval);
      clearInterval(locationInterval);
      clearInterval(iropInterval);
    };
  }, [linkId, fetchSession, fetchLocation, fetchIROPStatus]);

  const triggerDemoHandoff = useCallback(() => {
    if (!demoMode) return;
    const handoff = createHelperDemoHandoff();
    setDemoHandoff(handoff);
    setHandoffTriggered(true);
  }, [demoMode]);

  const simulateAgentJoin = useCallback(() => {
    if (!demoHandoff) return;
    const updated = updateDemoHandoffStatus(demoHandoff.handoff_id, 'agent_joined');
    if (updated) setDemoHandoff(updated);
  }, [demoHandoff]);

  const simulateResolveHandoff = useCallback(() => {
    if (!demoHandoff) return;
    const updated = updateDemoHandoffStatus(demoHandoff.handoff_id, 'resolved');
    if (updated) setDemoHandoff(updated);
  }, [demoHandoff]);

  useEffect(() => {
    if (demoMode) {
      const existing = getHelperDemoHandoff();
      if (existing && isHelperHandoffActive()) {
        setDemoHandoff(existing);
        setHandoffTriggered(true);
      }
    }
  }, [demoMode]);

  useEffect(() => {
    if (!demoMode) {
      demoStartTimeRef.current = null;
      setDemoProgress(0);
      setHandoffTriggered(false);
      setDemoHandoff(null);
      return;
    }
    if (demoStartTimeRef.current === null) demoStartTimeRef.current = Date.now();
    const demoInterval = setInterval(() => {
      if (demoStartTimeRef.current === null) return;
      const elapsed = Date.now() - demoStartTimeRef.current;
      const progress = Math.min(elapsed / DEMO_JOURNEY_DURATION_MS, 1);
      setDemoProgress(progress);
      if (progress >= 1) {
        setTimeout(() => {
          demoStartTimeRef.current = Date.now();
          setDemoProgress(0);
        }, 5000);
      }
    }, 1000);
    return () => clearInterval(demoInterval);
  }, [demoMode]);

  const currentWaypoint = demoMode ? getWaypointByProgress(demoProgress).current : null;
  const scenarioReservation = scenarioToReservation(selectedScenario);
  const passengerDisplayName = selectedScenario.passenger.nickname || selectedScenario.passenger.firstName;
  const effectiveLocationData = demoMode
    ? generateDFWDemoLocation(demoProgress, new Date(scenarioReservation.flights[0].departure_time), passengerDisplayName, scenarioReservation.flights[0]?.gate || 'B22')
    : locationData;

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim() || sending) return;
    setSending(true);
    try {
      await sendHelperSuggestion(linkId, suggestion);
      setSuggestion('');
      await fetchSession();
    } catch {
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
          <p className="text-body text-gray-600">Please ask your family member to share a new link.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-purple-600 text-white py-4 px-6 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <h1 className="text-lg font-bold leading-tight">Family Helper View</h1>
              <p className="text-sm opacity-80">Help your loved one navigate their journey</p>
            </div>
          </div>
          {demoMode && (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-purple-500 px-3 py-1.5 rounded-full font-medium">Demo Mode</span>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 hover:bg-purple-500 rounded-lg transition-colors"
                title={sidebarOpen ? 'Hide Controls' : 'Show Controls'}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Demo Controls */}
        {demoMode && sidebarOpen && (
          <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto shadow-sm">
            <div className="p-5 space-y-6">
              {/* Scenario Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Select Scenario
                </label>
                <select
                  value={selectedScenario.id}
                  onChange={(e) => {
                    const scenario = DEMO_SCENARIOS.find((s) => s.id === e.target.value);
                    if (scenario) {
                      setSelectedScenario(scenario);
                      setTranscriptPlaying(false);
                      if (handoffTriggered) {
                        resetHelperDemoHandoff();
                        setDemoHandoff(null);
                        setHandoffTriggered(false);
                      }
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
                >
                  {DEMO_SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.badge ? `(${s.badge})` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">{selectedScenario.shortDescription}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedScenario.features.map((f) => (
                    <span key={f} className="px-2.5 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">{f}</span>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Live Transcript */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Live Call Simulation
                </label>
                <DemoTranscript
                  scenario={selectedScenario}
                  isPlaying={transcriptPlaying}
                  onPlay={() => setTranscriptPlaying(true)}
                  onPause={() => setTranscriptPlaying(false)}
                  onReset={() => setTranscriptPlaying(false)}
                  onEvent={(event) => {
                    if (event === 'handoff' && !handoffTriggered) triggerDemoHandoff();
                  }}
                  className="h-72"
                />
              </div>

              {/* Divider */}
              <hr className="border-gray-100" />

              {/* Agent Handoff Controls */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Agent Handoff
                </label>
                <div className={`rounded-xl p-4 ${
                  handoffTriggered && demoHandoff?.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                  handoffTriggered && (demoHandoff?.status === 'agent_joined' || demoHandoff?.status === 'in_progress') ? 'bg-blue-50 border border-blue-200' :
                  handoffTriggered && demoHandoff?.status === 'resolved' ? 'bg-green-50 border border-green-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  {!handoffTriggered ? (
                    <>
                      <p className="text-xs text-gray-600 mb-3">
                        Simulate {passengerDisplayName} needing human agent assistance.
                      </p>
                      <button
                        onClick={triggerDemoHandoff}
                        className="w-full px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors"
                      >
                        Trigger Handoff
                      </button>
                    </>
                  ) : demoHandoff?.status === 'pending' ? (
                    <>
                      <p className="text-xs text-yellow-800 mb-3">Waiting for agent...</p>
                      <div className="flex gap-2">
                        <a href="/agent" target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-2 bg-yellow-500 text-white text-xs font-medium rounded-lg text-center hover:bg-yellow-600">
                          Agent Console
                        </a>
                        <button onClick={simulateAgentJoin} className="flex-1 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600">
                          Simulate Join
                        </button>
                      </div>
                    </>
                  ) : demoHandoff?.status === 'agent_joined' || demoHandoff?.status === 'in_progress' ? (
                    <>
                      <p className="text-xs text-blue-800 mb-3">Agent connected!</p>
                      <button onClick={simulateResolveHandoff} className="w-full px-4 py-2.5 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors">
                        Resolve Issue
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-green-800 mb-3">Issue resolved!</p>
                      <button
                        onClick={() => {
                          resetHelperDemoHandoff();
                          setDemoHandoff(null);
                          setHandoffTriggered(false);
                        }}
                        className="w-full px-4 py-2.5 bg-gray-500 text-white text-sm font-medium rounded-xl hover:bg-gray-600 transition-colors"
                      >
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Exit Demo */}
              <button
                onClick={() => setDemoMode(false)}
                className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              >
                Exit Demo Mode
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 p-8 space-y-8">
          {(reservation || demoMode) ? (
            <>
              {/* Passenger & Flight Dashboard */}
              <HelperDashboard reservation={reservation || scenarioReservation} />

              {/* IROP Alert */}
              {iropStatus && iropStatus.has_disruption && (
                <DisruptionAlert
                  iropStatus={iropStatus}
                  onAcceptRebooking={handleAcceptRebooking}
                  onAcknowledgeDisruption={handleAcknowledgeDisruption}
                  loading={iropLoading}
                />
              )}

              {/* Journey Progress - Demo Mode */}
              {demoMode && currentWaypoint && (
                <section className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-purple-800">Journey Progress</h2>
                    <span className="text-sm text-purple-600 font-medium bg-purple-100 px-3 py-1 rounded-full">
                      {Math.round(demoProgress * 100)}% complete
                    </span>
                  </div>
                  <div className="flex items-center gap-5 mb-4">
                    <div className="flex-1">
                      <p className="text-base font-medium text-purple-900">{currentWaypoint.name}</p>
                      <p className="text-sm text-purple-600 mt-1">{currentWaypoint.instruction}</p>
                    </div>
                    {demoProgress >= 1 && (
                      <span className="px-4 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                        Arrived!
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${demoProgress * 100}%` }}
                    />
                  </div>
                  {/* Waypoint dots */}
                  <div className="flex justify-between mt-3">
                    {DFW_JOURNEY_WAYPOINTS.filter((_, i) => i % 3 === 0 || i === DFW_JOURNEY_WAYPOINTS.length - 1).map((wp, idx, arr) => {
                      const wpIndex = DFW_JOURNEY_WAYPOINTS.indexOf(wp);
                      const wpProgress = wpIndex / (DFW_JOURNEY_WAYPOINTS.length - 1);
                      const isCompleted = demoProgress >= wpProgress;
                      const isCurrent = currentWaypoint?.id === wp.id;
                      return (
                        <div key={wp.id} className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            isCurrent ? 'bg-purple-600 ring-2 ring-purple-300' :
                            isCompleted ? 'bg-purple-600' : 'bg-purple-300'
                          }`} />
                          <span className={`text-xs mt-1.5 ${isCompleted ? 'text-purple-700' : 'text-purple-400'}`}>
                            {idx === 0 ? 'Start' : idx === arr.length - 1 ? 'Gate' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Location Tracking Map */}
              <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Live Location</h2>
                  {effectiveLocationData?.metrics?.alert_status && (
                    <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                      effectiveLocationData.metrics.alert_status === 'safe' ? 'bg-green-100 text-green-700' :
                      effectiveLocationData.metrics.alert_status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      effectiveLocationData.metrics.alert_status === 'urgent' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {effectiveLocationData.metrics.alert_status === 'safe' ? 'On Track' :
                       effectiveLocationData.metrics.alert_status === 'warning' ? 'Running Late' :
                       effectiveLocationData.metrics.alert_status === 'urgent' ? 'Urgent' : 'Arrived'}
                    </span>
                  )}
                </div>
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
              </section>

              {/* Conversation */}
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Conversation</h2>
                <div className="space-y-4 max-h-72 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 text-sm">
                      No messages yet. The conversation will appear here.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl text-sm ${
                          msg.role === 'user' ? 'bg-gray-100 ml-8' :
                          msg.role === 'family' ? 'bg-purple-100 mr-8 border border-purple-200' :
                          'bg-aa-blue text-white mr-8'
                        }`}
                      >
                        <p className="text-xs font-medium mb-1.5 opacity-60">
                          {msg.role === 'user' ? 'Your family member' : msg.role === 'family' ? 'You suggested' : 'AI Assistant'}
                        </p>
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Send Suggestion */}
              <section className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Send a Suggestion</h2>
                <p className="text-sm text-gray-500 mb-4">Your message will be read aloud to your family member.</p>
                <form onSubmit={handleSendSuggestion} className="flex gap-4">
                  <input
                    type="text"
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="Type your suggestion..."
                    className="flex-1 px-5 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !suggestion.trim()}
                    className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </section>
            </>
          ) : (
            /* Waiting State */
            <section className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-yellow-800">Waiting for Reservation</h2>
                </div>
                <button
                  onClick={() => setDemoMode(true)}
                  className="px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Try Demo
                </button>
              </div>
              <p className="text-yellow-700 text-base leading-relaxed">
                Your family member hasn't looked up their reservation yet. Once they provide their confirmation code,
                you'll see their flight details here.
              </p>
            </section>
          )}

          {/* Help Tips - Collapsible */}
          <details className="bg-purple-50 rounded-2xl border border-purple-200">
            <summary className="px-6 py-4 cursor-pointer text-lg font-semibold text-purple-800 hover:bg-purple-100 rounded-2xl transition-colors">
              How to Help
            </summary>
            <ul className="px-6 pb-5 text-base text-purple-700 space-y-2 list-disc list-inside">
              <li>Watch the conversation to see what they're trying to do</li>
              <li>Send suggestions that will be read aloud to them</li>
              <li>Your family member must confirm any changes themselves</li>
              <li>This page updates automatically every few seconds</li>
            </ul>
          </details>
        </div>
      </div>
    </main>
  );
}
