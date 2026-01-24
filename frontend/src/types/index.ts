// Core data types for AA Voice Concierge

export interface Passenger {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  aadvantage_number?: string;
  preferences: {
    language: 'en' | 'es';
    seat_preference?: 'window' | 'aisle' | 'middle';
  };
}

export interface FlightSegment {
  id: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  gate?: string;
  status: 'scheduled' | 'delayed' | 'cancelled' | 'boarding' | 'departed';
  seat?: string;
}

export interface Reservation {
  id: string;
  confirmation_code: string;
  passenger: Passenger;
  flights: FlightSegment[];
  status: 'confirmed' | 'changed' | 'cancelled';
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'family';
  content: string;
  audio_url?: string;
  timestamp: string;
  intent?: string;
  entities?: Record<string, unknown>;
}

export interface Session {
  id: string;
  state: 'greeting' | 'lookup' | 'viewing' | 'changing' | 'confirming' | 'complete';
  reservation_id?: string;
  messages: Message[];
  helper_link?: string;
  created_at: string;
  expires_at: string;
}

export interface ConversationResponse {
  reply: string;
  audio_url: string;
  intent: string;
  entities: Record<string, unknown>;
  suggested_actions: SuggestedAction[];
  session_state: string;
  reservation?: Reservation;
  flight_options?: FlightSegment[];
}

export interface SuggestedAction {
  type: 'confirm' | 'select_flight' | 'start_over' | 'get_help';
  label: string;
  value?: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

// Retell AI Types
export interface RetellAgent {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  voice_speed: number;
  voice_temperature: number;
  created_at?: string;
}

export interface RetellWebCall {
  call_id: string;
  agent_id: string;
  access_token: string;
  call_type: 'web_call';
  call_status: 'registered' | 'ongoing' | 'ended' | 'error';
  metadata?: Record<string, unknown>;
}

export interface RetellPhoneCall {
  call_id: string;
  agent_id: string;
  to_number: string;
  from_number?: string;
  call_type: 'phone_call';
  call_status: 'registered' | 'ongoing' | 'ended' | 'error';
  direction: 'outbound' | 'inbound';
  start_time?: string;
  end_time?: string;
  transcript?: Array<{
    role: 'agent' | 'user';
    content: string;
    timestamp: number;
  }>;
}

export interface RetellStatus {
  configured: boolean;
  service: string;
}
