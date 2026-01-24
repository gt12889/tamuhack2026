import axios from 'axios';
import type { ConversationResponse, Reservation, Session, FlightSegment } from '@/types';

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

export async function getHelperSession(linkId: string): Promise<{
  session: Session;
  reservation: Reservation | null;
  messages: Array<{ role: string; content: string; timestamp: string }>;
}> {
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

export default api;
