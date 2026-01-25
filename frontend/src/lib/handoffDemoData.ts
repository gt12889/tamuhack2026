// Demo data for agent handoff feature
import type {
  HandoffDossier,
  HandoffTranscriptMessage,
  HandoffMetadata,
  HandoffReason,
  SentimentScore,
} from '@/types';

// Generate a unique handoff ID for demo
export function generateDemoHandoffId(): string {
  return `demo-handoff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Demo transcript messages
const DEMO_TRANSCRIPT: HandoffTranscriptMessage[] = [
  {
    id: 'msg-1',
    role: 'ai',
    content: "Hello! Welcome to American Airlines. I'm your virtual assistant. How can I help you today?",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'msg-2',
    role: 'user',
    content: "Hi, I need to change my flight. My confirmation code is CZYBYU.",
    timestamp: new Date(Date.now() - 280000).toISOString(),
  },
  {
    id: 'msg-3',
    role: 'ai',
    content: "I found your reservation, Margaret. You're booked on flight AA1845 from Dallas to Chicago, departing tomorrow at 2:30 PM. What changes would you like to make?",
    timestamp: new Date(Date.now() - 260000).toISOString(),
  },
  {
    id: 'msg-4',
    role: 'user',
    content: "I need to fly out today instead. My daughter is in the hospital and I need to get there as soon as possible.",
    timestamp: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: 'msg-5',
    role: 'ai',
    content: "I'm so sorry to hear about your daughter. Let me check what flights are available today. I see we have a flight at 5:45 PM with available seats. However, there would normally be a $200 change fee.",
    timestamp: new Date(Date.now() - 220000).toISOString(),
  },
  {
    id: 'msg-6',
    role: 'user',
    content: "This is an emergency! I've been an AAdvantage member for 15 years. Can't you waive the fee? I really need to get to my daughter.",
    timestamp: new Date(Date.now() - 200000).toISOString(),
  },
  {
    id: 'msg-7',
    role: 'ai',
    content: "I completely understand the urgency of your situation, Margaret. For fee waivers in emergency situations, I need to connect you with one of our specialists who has the authorization to help. Let me transfer you now - I've shared all your details with them so you won't need to repeat anything.",
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
];

// Demo metadata
const DEMO_METADATA: HandoffMetadata = {
  confirmation_code: 'CZYBYU',
  flight_number: 'AA1845',
  flight_id: 'flight-demo-001',
  passenger_name: 'Margaret Johnson',
  passenger_email: 'margaret.johnson@email.com',
  passenger_phone: '(555) 123-4567',
  aadvantage_number: '1234567890',
  issue_type: 'emergency_change',
};

// Generate a complete demo handoff dossier
export function generateDemoHandoff(
  handoffId: string,
  reason: HandoffReason = 'authorization_required'
): HandoffDossier {
  return {
    handoff_id: handoffId,
    session_id: `session-${Date.now()}`,
    status: 'pending',
    priority: 'urgent',

    conversation_summary:
      'Customer Margaret Johnson needs to change her flight AA1845 (DFW→ORD) from tomorrow to today due to a family medical emergency. She is requesting a change fee waiver citing her 15-year AAdvantage membership status.',

    ai_actions_taken: [
      'Looked up reservation CZYBYU',
      'Found available flight at 5:45 PM today',
      'Explained standard $200 change fee',
      'Recognized emergency situation keywords',
    ],

    sentiment_score: 'urgent' as SentimentScore,
    sentiment_reason: 'Customer mentioned family medical emergency and expressed urgency multiple times',

    metadata: DEMO_METADATA,

    reservation: {
      id: 'res-demo-001',
      confirmation_code: 'CZYBYU',
      passenger: {
        id: 'pax-demo-001',
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
          id: 'flight-demo-001',
          flight_number: 'AA1845',
          origin: 'DFW',
          destination: 'ORD',
          departure_time: new Date(Date.now() + 86400000).toISOString(),
          arrival_time: new Date(Date.now() + 86400000 + 10800000).toISOString(),
          gate: 'B22',
          status: 'scheduled',
          seat: '14A',
        },
      ],
      status: 'confirmed',
      created_at: new Date(Date.now() - 604800000).toISOString(),
    },

    transcript: DEMO_TRANSCRIPT,

    handoff_reason: reason,
    handoff_reason_detail: 'Customer requesting fee waiver for emergency same-day flight change - requires supervisor authorization',

    suggested_first_response:
      "Hi Margaret, this is [Agent Name] from American Airlines. I've reviewed your situation and I want to help get you to your daughter as quickly as possible. Given the emergency circumstances and your loyalty as a 15-year AAdvantage member, I'm authorized to waive the change fee. Let me get you on that 5:45 PM flight right now.",

    suggested_actions: [
      'Waive the $200 change fee',
      'Rebook to AA1847 departing 5:45 PM today',
      'Offer complimentary seat upgrade if available',
      'Provide direct contact for future emergencies',
    ],

    created_at: new Date().toISOString(),
    bridge_message:
      "I'm connecting you with a specialist who can help with your request. I've shared all your flight details and our conversation with them so you won't need to repeat anything. They'll be with you in just a moment.",
  };
}

// Store for demo handoffs (in-memory for frontend demo)
const demoHandoffStore: Map<string, HandoffDossier> = new Map();

// Get or create demo handoff
export function getOrCreateDemoHandoff(handoffId?: string): HandoffDossier {
  if (handoffId && demoHandoffStore.has(handoffId)) {
    return demoHandoffStore.get(handoffId)!;
  }

  const newId = handoffId || generateDemoHandoffId();
  const dossier = generateDemoHandoff(newId);
  demoHandoffStore.set(newId, dossier);
  return dossier;
}

// Update demo handoff status
export function updateDemoHandoffStatus(
  handoffId: string,
  status: 'pending' | 'agent_joined' | 'in_progress' | 'resolved' | 'abandoned'
): HandoffDossier | null {
  const dossier = demoHandoffStore.get(handoffId);
  if (!dossier) return null;

  dossier.status = status;
  if (status === 'agent_joined') {
    dossier.agent_joined_at = new Date().toISOString();
  }
  if (status === 'resolved') {
    dossier.resolved_at = new Date().toISOString();
  }

  demoHandoffStore.set(handoffId, dossier);
  return dossier;
}

// Add message to demo handoff
export function addDemoHandoffMessage(
  handoffId: string,
  role: 'user' | 'ai' | 'agent',
  content: string
): HandoffTranscriptMessage | null {
  const dossier = demoHandoffStore.get(handoffId);
  if (!dossier) return null;

  const message: HandoffTranscriptMessage = {
    id: `msg-${Date.now()}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  dossier.transcript.push(message);
  demoHandoffStore.set(handoffId, dossier);
  return message;
}
