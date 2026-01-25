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
  default_agent_id?: string;
}

// ElevenLabs Conversational AI Types
export interface ElevenLabsStatus {
  configured: boolean;
  service: string;
  agent_id: string | null;
}

export interface ElevenLabsSignedUrlResponse {
  signed_url: string;
  agent_id: string;
  session_id?: string;
  session_state?: string;
  confirmation_code?: string;
}

export interface ElevenLabsMessage {
  source: 'ai' | 'user';
  message: string;
}

export interface ElevenLabsModeChange {
  mode: 'speaking' | 'listening';
}

// Family Helper Action Types
export type FamilyActionType =
  | 'change_flight'
  | 'cancel_flight'
  | 'select_seat'
  | 'add_bags'
  | 'request_wheelchair'
  | 'accept_rebooking'
  | 'acknowledge_disruption';

export interface FamilyAction {
  id: string;
  action_type: FamilyActionType;
  display_name: string;
  action_data: Record<string, unknown>;
  status: 'executed' | 'failed';
  family_notes: string;
  result_message: string;
  created_at: string;
}

export interface AvailableAction {
  action_type: FamilyActionType;
  display_name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface HelperSessionResponse {
  session: Session;
  reservation: Reservation | null;
  messages: Message[];
  available_actions: AvailableAction[];
  action_history: FamilyAction[];
  helper_link_mode: 'session' | 'persistent';
  helper_link_expires_at: string;
}

export interface FlightOption {
  id: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration?: string;
  gate?: string;
  status?: string;
}

export interface SeatInfo {
  id: string;
  row: number;
  column: string;
  type: 'window' | 'aisle' | 'middle';
  available: boolean;
  is_current: boolean;
  is_exit_row: boolean;
  is_extra_legroom: boolean;
  price_difference: number;
}

export interface SeatMapResponse {
  flight_number: string;
  current_seat: string | null;
  seats: SeatInfo[];
  cabin_config: string;
  total_rows: number;
}

export interface ActionResult {
  success: boolean;
  action_id?: string;
  message?: string;
  error?: string;
}

// Location Tracking Types

export type AlertStatus = 'safe' | 'warning' | 'urgent' | 'arrived';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number | null;
  timestamp: string;
}

export interface GateLocation {
  lat: number;
  lng: number;
  gate: string;
  terminal: string;
  approximate?: boolean;
}

export interface LocationMetrics {
  distance_meters: number | null;
  walking_time_minutes: number | null;
  time_to_departure_minutes: number | null;
  alert_status: AlertStatus | null;
}

export interface LocationAlert {
  id: string;
  type: string;
  message: string;
  created_at: string;
}

export interface HelperLocationResponse {
  passenger_location: LocationData | null;
  gate_location: GateLocation | null;
  metrics: LocationMetrics | null;
  directions: string;
  message: string;
  alert: LocationAlert | null;
}

export interface LocationUpdateResponse {
  stored: boolean;
  location_id: string | null;
  metrics: LocationMetrics | null;
  alert_status: AlertStatus | null;
  directions: string;
  alert_triggered: boolean;
}

// DFW Airport Navigation Types
export interface DFWWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  terminal: string;
  instruction: string;
  landmarks: string[];
  estimatedTimeFromStart: number;
}

// IROP (Irregular Operations) Types
export type DisruptionType = 'delay' | 'cancellation' | 'missed_connection' | 'crew_unavailable' | 'aircraft_issue';
export type ConnectionRiskLevel = 'low' | 'medium' | 'high';

export interface RebookingOption {
  option_id: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  gate?: string;
  seat?: string;
  connection_risk?: ConnectionRiskLevel;
  is_auto_offered: boolean;
  acceptance_deadline?: string;
}

export interface ConnectionRisk {
  connection_flight_number: string;
  origin: string;
  destination: string;
  connection_time_minutes: number;
  minimum_connection_time: number;
  risk_level: ConnectionRiskLevel;
  reason: string;
}

export interface FlightDisruption {
  id: string;
  flight_id: string;
  flight_number: string;
  disruption_type: DisruptionType;
  severity: ConnectionRiskLevel;
  original_departure_time: string;
  new_estimated_departure_time?: string;
  delay_minutes?: number;
  message: string;
  rebooking_options: RebookingOption[];
  auto_rebooked_option?: RebookingOption;
  connection_risks: ConnectionRisk[];
  acknowledged: boolean;
  acknowledged_at?: string;
  created_at: string;
}

export interface IROPStatus {
  has_disruption: boolean;
  disruption?: FlightDisruption;
  affected_flights: string[];
  connection_at_risk: boolean;
  auto_rebooking_available: boolean;
  requires_action: boolean;
}

// Agent Handoff Types
export type HandoffStatus = 'pending' | 'agent_joined' | 'in_progress' | 'resolved' | 'abandoned';
export type SentimentScore = 'calm' | 'neutral' | 'frustrated' | 'urgent' | 'angry';
export type HandoffReason =
  | 'customer_request'
  | 'complex_issue'
  | 'frustration_detected'
  | 'authorization_required'
  | 'technical_issue'
  | 'policy_exception';

export interface HandoffTranscriptMessage {
  id: string;
  role: 'user' | 'ai' | 'agent';
  content: string;
  timestamp: string;
}

export interface HandoffMetadata {
  confirmation_code?: string;
  flight_number?: string;
  flight_id?: string;
  passenger_name?: string;
  passenger_email?: string;
  passenger_phone?: string;
  aadvantage_number?: string;
  issue_type?: string;
  [key: string]: unknown;
}

export interface HandoffDossier {
  handoff_id: string;
  session_id: string;
  status: HandoffStatus;
  priority: 'normal' | 'high' | 'urgent';

  // Conversation Summary
  conversation_summary: string;
  ai_actions_taken: string[];

  // Sentiment
  sentiment_score: SentimentScore;
  sentiment_reason?: string;

  // Structured Metadata
  metadata: HandoffMetadata;
  reservation?: Reservation;

  // Full Transcript
  transcript: HandoffTranscriptMessage[];

  // Handoff Details
  handoff_reason: HandoffReason;
  handoff_reason_detail?: string;

  // Agent Assist
  suggested_first_response?: string;
  suggested_actions?: string[];

  // Timestamps
  created_at: string;
  agent_joined_at?: string;
  resolved_at?: string;

  // Customer bridge message (what AI told customer)
  bridge_message?: string;
}

export interface CreateHandoffRequest {
  session_id: string;
  reason: HandoffReason;
  reason_detail?: string;
  transcript: HandoffTranscriptMessage[];
  metadata?: HandoffMetadata;
}

export interface CreateHandoffResponse {
  handoff_id: string;
  agent_url: string;
  bridge_message: string;
  status: HandoffStatus;
}

export interface AgentMessage {
  handoff_id: string;
  message: string;
  is_internal_note?: boolean;
}

export interface HandoffUpdate {
  handoff_id: string;
  status?: HandoffStatus;
  resolution_notes?: string;
}
