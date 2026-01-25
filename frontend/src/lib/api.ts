import axios from 'axios';
import type {
  ConversationResponse,
  Reservation,
  Session,
  FlightSegment,
  HelperSessionResponse,
  FlightOption,
  SeatMapResponse,
  ActionResult,
  HelperLocationResponse,
  LocationUpdateResponse,
  IROPStatus,
  HandoffDossier,
  CreateHandoffRequest,
  CreateHandoffResponse,
  HandoffStatus,
} from '@/types';

// Default to port 8000, but allow override via environment variable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Conversation API
export async function startConversation(sessionId?: string): Promise<{
  session_id: string;
  greeting: string;
  audio_url: string;
}> {
  const response = await api.post('/api/conversation/start', { session_id: sessionId });
  return response.data;
}

export async function sendMessage(
  sessionId: string,
  transcript: string
): Promise<ConversationResponse> {
  const response = await api.post('/api/conversation/message', {
    session_id: sessionId,
    transcript,
  });
  return response.data;
}

export async function getSession(sessionId: string): Promise<Session> {
  const response = await api.get(`/api/conversation/${sessionId}`);
  return response.data;
}

// Reservation API
export async function lookupReservation(params: {
  confirmation_code?: string;
  last_name?: string;
  email?: string;
}): Promise<Reservation> {
  const response = await api.get('/api/reservation/lookup', { params });
  return response.data.reservation;
}

export async function changeReservation(
  sessionId: string,
  reservationId: string,
  newFlightId: string
): Promise<{
  success: boolean;
  new_reservation: Reservation;
  confirmation_message: string;
}> {
  const response = await api.post('/api/reservation/change', {
    session_id: sessionId,
    reservation_id: reservationId,
    new_flight_id: newFlightId,
  });
  return response.data;
}

export async function getAlternativeFlights(
  origin: string,
  destination: string,
  date: string,
  originalFlightId: string
): Promise<FlightSegment[]> {
  const response = await api.get('/api/flights/alternatives', {
    params: { origin, destination, date, original_flight_id: originalFlightId },
  });
  return response.data.flights;
}

// Voice API
export async function synthesizeVoice(
  text: string,
  language: 'en' | 'es' = 'en'
): Promise<{ audio_url: string; duration_ms: number }> {
  const response = await api.post('/api/voice/synthesize', { text, language });
  return response.data;
}

// Family Helper API
export async function createHelperLink(sessionId: string): Promise<{
  helper_link: string;
  expires_at: string;
}> {
  const response = await api.post('/api/helper/create-link', { session_id: sessionId });
  return response.data;
}

export async function getHelperSession(linkId: string): Promise<HelperSessionResponse> {
  const response = await api.get(`/api/helper/${linkId}`);
  return response.data;
}

export async function sendHelperSuggestion(
  linkId: string,
  message: string
): Promise<{ success: boolean }> {
  const response = await api.post(`/api/helper/${linkId}/suggest`, { message });
  return response.data;
}

// Family Helper Action API
export async function getHelperActions(linkId: string): Promise<{
  available_actions: Array<{
    action_type: string;
    display_name: string;
    description: string;
    icon: string;
    enabled: boolean;
  }>;
  action_history: Array<{
    id: string;
    action_type: string;
    display_name: string;
    status: string;
    result_message: string;
    created_at: string;
  }>;
}> {
  const response = await api.get(`/api/helper/${linkId}/actions`);
  return response.data;
}

export async function helperChangeFlight(
  linkId: string,
  newFlightId: string,
  notes?: string
): Promise<ActionResult> {
  const response = await api.post(`/api/helper/${linkId}/actions/change-flight`, {
    new_flight_id: newFlightId,
    notes: notes || '',
  });
  return response.data;
}

export async function helperCancelFlight(
  linkId: string,
  reason?: string,
  notes?: string
): Promise<ActionResult> {
  const response = await api.post(`/api/helper/${linkId}/actions/cancel-flight`, {
    reason: reason || '',
    notes: notes || '',
  });
  return response.data;
}

export async function helperSelectSeat(
  linkId: string,
  seat: string,
  flightSegmentId?: string,
  notes?: string
): Promise<ActionResult> {
  const response = await api.post(`/api/helper/${linkId}/actions/select-seat`, {
    seat,
    flight_segment_id: flightSegmentId,
    notes: notes || '',
  });
  return response.data;
}

export async function helperAddBags(
  linkId: string,
  bagCount: number,
  notes?: string
): Promise<ActionResult> {
  const response = await api.post(`/api/helper/${linkId}/actions/add-bags`, {
    bag_count: bagCount,
    notes: notes || '',
  });
  return response.data;
}

export async function helperRequestWheelchair(
  linkId: string,
  assistanceType: 'wheelchair' | 'wheelchair_ramp' | 'escort' = 'wheelchair',
  notes?: string
): Promise<ActionResult> {
  const response = await api.post(`/api/helper/${linkId}/actions/request-wheelchair`, {
    assistance_type: assistanceType,
    notes: notes || '',
  });
  return response.data;
}

export async function getHelperFlights(linkId: string): Promise<{
  current_flight: {
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string | null;
  };
  alternative_flights: FlightOption[];
}> {
  const response = await api.get(`/api/helper/${linkId}/flights`);
  return response.data;
}

export async function getHelperSeats(linkId: string): Promise<SeatMapResponse> {
  const response = await api.get(`/api/helper/${linkId}/seats`);
  return response.data;
}

// ElevenLabs Conversational AI API
export async function getElevenLabsStatus(): Promise<{
  configured: boolean;
  service: string;
  agent_id: string | null;
}> {
  const response = await api.get('/api/elevenlabs/convai/status');
  return response.data;
}

export async function getElevenLabsSignedUrl(params: {
  agent_id?: string;
  session_id?: string;
  language?: string;
}): Promise<{
  signed_url: string;
  agent_id: string;
  session_id?: string;
  session_state?: string;
  confirmation_code?: string;
}> {
  const response = await api.post('/api/elevenlabs/convai/web-call', params);
  return response.data;
}

export async function getElevenLabsTranscript(conversationId: string): Promise<{
  conversation_id: string;
  messages: Array<{
    role: 'user' | 'agent' | 'assistant';
    content: string;
    text?: string;
    timestamp?: string;
  }>;
  duration_ms?: number;
  status?: string;
}> {
  const response = await api.get(`/api/elevenlabs/convai/conversation/${conversationId}`);
  return response.data;
}

// Location Tracking API
export async function updateLocation(
  sessionId: string,
  latitude: number,
  longitude: number,
  accuracy?: number
): Promise<LocationUpdateResponse> {
  const response = await api.post('/api/location/update', {
    session_id: sessionId,
    latitude,
    longitude,
    accuracy,
  });
  return response.data;
}

export async function getHelperLocation(linkId: string): Promise<HelperLocationResponse> {
  const response = await api.get(`/api/helper/${linkId}/location`);
  return response.data;
}

export async function triggerLocationAlert(
  sessionId: string,
  alertType: 'running_late' | 'urgent' | 'manual'
): Promise<{ success: boolean; alert_id?: string; message?: string }> {
  const response = await api.post('/api/location/alert', {
    session_id: sessionId,
    alert_type: alertType,
  });
  return response.data;
}

export async function getLocationHistory(
  sessionId: string
): Promise<{
  locations: Array<{
    id: string;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: string;
  }>;
}> {
  const response = await api.get(`/api/location/${sessionId}/history`);
  return response.data;
}

export async function getLocationAlerts(
  sessionId: string
): Promise<{
  alerts: Array<{
    id: string;
    alert_type: string;
    message: string;
    acknowledged: boolean;
    created_at: string;
  }>;
}> {
  const response = await api.get(`/api/location/${sessionId}/alerts`);
  return response.data;
}

export async function acknowledgeAlert(alertId: string): Promise<{ success: boolean }> {
  const response = await api.post(`/api/location/alerts/${alertId}/acknowledge`);
  return response.data;
}

// IROP (Irregular Operations) API
export async function getIROPStatus(linkId: string): Promise<IROPStatus> {
  const response = await api.get(`/api/helper/${linkId}/irop-status`);
  return response.data;
}

export async function helperAcceptRebooking(
  linkId: string,
  rebookingOptionId: string,
  notes?: string
): Promise<ActionResult> {
  const response = await api.post(`/api/helper/${linkId}/actions/accept-rebooking`, {
    rebooking_option_id: rebookingOptionId,
    notes: notes || '',
  });
  return response.data;
}

export async function helperAcknowledgeDisruption(
  linkId: string,
  disruptionId: string,
  notes?: string
): Promise<ActionResult> {
  const response = await api.post(`/api/helper/${linkId}/actions/acknowledge-disruption`, {
    disruption_id: disruptionId,
    notes: notes || '',
  });
  return response.data;
}

// Agent Handoff API
export async function createHandoff(
  request: CreateHandoffRequest
): Promise<CreateHandoffResponse> {
  const response = await api.post('/api/handoff/create', request);
  return response.data;
}

export async function getHandoff(handoffId: string): Promise<HandoffDossier> {
  const response = await api.get(`/api/handoff/${handoffId}`);
  return response.data;
}

export async function getActiveHandoffs(): Promise<{
  handoffs: HandoffDossier[];
  total_pending: number;
}> {
  const response = await api.get('/api/handoff/active');
  return response.data;
}

export async function agentJoinHandoff(handoffId: string): Promise<{
  success: boolean;
  handoff: HandoffDossier;
}> {
  const response = await api.post(`/api/handoff/${handoffId}/join`);
  return response.data;
}

export async function agentSendMessage(
  handoffId: string,
  message: string,
  isInternalNote: boolean = false
): Promise<{
  success: boolean;
  message_id: string;
}> {
  const response = await api.post(`/api/handoff/${handoffId}/message`, {
    message,
    is_internal_note: isInternalNote,
  });
  return response.data;
}

export async function updateHandoffStatus(
  handoffId: string,
  status: HandoffStatus,
  resolutionNotes?: string
): Promise<{
  success: boolean;
  handoff: HandoffDossier;
}> {
  const response = await api.post(`/api/handoff/${handoffId}/status`, {
    status,
    resolution_notes: resolutionNotes,
  });
  return response.data;
}

export async function getHandoffMessages(handoffId: string): Promise<{
  messages: Array<{
    id: string;
    role: 'user' | 'ai' | 'agent';
    content: string;
    timestamp: string;
    is_internal_note?: boolean;
  }>;
}> {
  const response = await api.get(`/api/handoff/${handoffId}/messages`);
  return response.data;
}

export default api;
