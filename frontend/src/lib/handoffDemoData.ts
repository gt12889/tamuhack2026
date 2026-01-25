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
    content: "Hello! Welcome to Elder Strolls. I'm your virtual assistant. How can I help you today?",
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
      "Hi Margaret, this is [Agent Name] from Elder Strolls. I've reviewed your situation and I want to help get you to your daughter as quickly as possible. Given the emergency circumstances and your loyalty as a 15-year AAdvantage member, I'm authorized to waive the change fee. Let me get you on that 5:45 PM flight right now.",

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

// Demo handoff scenarios for the console
const DEMO_SCENARIOS: Array<{
  id: string;
  reason: HandoffReason;
  priority: 'normal' | 'high' | 'urgent';
  sentiment: SentimentScore;
  summary: string;
  passengerName: string;
  confirmationCode: string;
  flightNumber: string;
  createdMinutesAgo: number;
}> = [
  {
    id: 'demo-handoff-emergency-001',
    reason: 'authorization_required',
    priority: 'urgent',
    sentiment: 'urgent',
    summary: 'Customer needs emergency same-day flight change due to family medical situation. Requesting fee waiver.',
    passengerName: 'Margaret Johnson',
    confirmationCode: 'CZYBYU',
    flightNumber: 'AA1845',
    createdMinutesAgo: 2,
  },
  {
    id: 'demo-handoff-refund-002',
    reason: 'customer_request',
    priority: 'high',
    sentiment: 'frustrated',
    summary: 'Customer upset about flight cancellation. Wants full refund and compensation for hotel costs.',
    passengerName: 'Robert Chen',
    confirmationCode: 'TEST45',
    flightNumber: 'AA567',
    createdMinutesAgo: 5,
  },
  {
    id: 'demo-handoff-upgrade-003',
    reason: 'complex_issue',
    priority: 'normal',
    sentiment: 'neutral',
    summary: 'Executive Platinum member requesting upgrade to first class for anniversary trip.',
    passengerName: 'Sarah Williams',
    confirmationCode: 'ABUEL1',
    flightNumber: 'AA234',
    createdMinutesAgo: 8,
  },
  {
    id: 'demo-handoff-complaint-004',
    reason: 'customer_request',
    priority: 'high',
    sentiment: 'angry',
    summary: 'Customer missed connection due to delayed first flight. Very upset, demanding rebooking and compensation.',
    passengerName: 'James Thompson',
    confirmationCode: 'SENR02',
    flightNumber: 'AA789',
    createdMinutesAgo: 12,
  },
  {
    id: 'demo-handoff-medical-005',
    reason: 'authorization_required',
    priority: 'urgent',
    sentiment: 'urgent',
    summary: 'Passenger requires wheelchair assistance and oxygen. Special accommodations need supervisor approval.',
    passengerName: 'Dorothy Williams',
    confirmationCode: 'FAML03',
    flightNumber: 'AA456',
    createdMinutesAgo: 15,
  },
];

// Get all demo handoffs for the console listing
export function getDemoHandoffsList(): HandoffDossier[] {
  // Initialize demo handoffs if not already done
  DEMO_SCENARIOS.forEach((scenario) => {
    if (!demoHandoffStore.has(scenario.id)) {
      const dossier: HandoffDossier = {
        handoff_id: scenario.id,
        session_id: `session-${scenario.id}`,
        status: 'pending',
        priority: scenario.priority,
        conversation_summary: scenario.summary,
        ai_actions_taken: ['Looked up reservation', 'Attempted to resolve automatically', 'Determined human assistance required'],
        sentiment_score: scenario.sentiment,
        sentiment_reason: `Customer sentiment detected as ${scenario.sentiment}`,
        metadata: {
          confirmation_code: scenario.confirmationCode,
          flight_number: scenario.flightNumber,
          passenger_name: scenario.passengerName,
          passenger_email: `${scenario.passengerName.toLowerCase().replace(' ', '.')}@email.com`,
          passenger_phone: '(555) 000-0000',
          issue_type: scenario.reason,
        },
        reservation: undefined,
        transcript: [
          {
            id: 'msg-1',
            role: 'user',
            content: `Help needed with ${scenario.flightNumber}`,
            timestamp: new Date(Date.now() - scenario.createdMinutesAgo * 60000).toISOString(),
          },
        ],
        handoff_reason: scenario.reason,
        handoff_reason_detail: scenario.summary,
        suggested_first_response: 'Hello, I see you need assistance. Let me help you with that.',
        suggested_actions: [],
        created_at: new Date(Date.now() - scenario.createdMinutesAgo * 60000).toISOString(),
      };
      demoHandoffStore.set(scenario.id, dossier);
    }
  });

  // Return all handoffs from the store
  return Array.from(demoHandoffStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// Get counts by status
export function getDemoHandoffCounts(): { pending: number; in_progress: number; resolved: number } {
  const handoffs = getDemoHandoffsList();
  return {
    pending: handoffs.filter((h) => h.status === 'pending').length,
    in_progress: handoffs.filter((h) => h.status === 'agent_joined' || h.status === 'in_progress').length,
    resolved: handoffs.filter((h) => h.status === 'resolved').length,
  };
}

// Helper-specific handoff for family helper demo mode
const HELPER_HANDOFF_ID = 'demo-helper-meemaw-handoff';

// Transcript for MeeMaw scenario (fee waiver request during urgent rebooking)
const MEEMAW_TRANSCRIPT: HandoffTranscriptMessage[] = [
  {
    id: 'hm-1',
    role: 'ai',
    content: "Hello! Welcome to American Airlines. I'm your voice assistant. How can I help you today?",
    timestamp: new Date(Date.now() - 420000).toISOString(),
  },
  {
    id: 'hm-2',
    role: 'user',
    content: "Hi, this is Margaret. I need to change my flight to Chicago. My grandson is in the hospital.",
    timestamp: new Date(Date.now() - 400000).toISOString(),
  },
  {
    id: 'hm-3',
    role: 'ai',
    content: "I'm so sorry to hear about your grandson, Margaret. Let me look up your reservation. Can you provide your confirmation code?",
    timestamp: new Date(Date.now() - 380000).toISOString(),
  },
  {
    id: 'hm-4',
    role: 'user',
    content: "It's DFW123. I'm at the airport right now at Terminal A.",
    timestamp: new Date(Date.now() - 360000).toISOString(),
  },
  {
    id: 'hm-5',
    role: 'ai',
    content: "Thank you, Margaret. I found your reservation - flight AA2847 from DFW to ORD, departing at 3:30 PM from Gate B22. I see there's an earlier flight at 1:15 PM, but there would be a $200 change fee.",
    timestamp: new Date(Date.now() - 340000).toISOString(),
  },
  {
    id: 'hm-6',
    role: 'user',
    content: "Oh dear, that's quite a lot. This is a family emergency - my grandson was in an accident. I'm a Gold member, can the fee be waived?",
    timestamp: new Date(Date.now() - 320000).toISOString(),
  },
  {
    id: 'hm-7',
    role: 'ai',
    content: "I completely understand, Margaret. For fee waivers due to family emergencies, I need to connect you with one of our customer care specialists who can authorize this. I'm transferring you now and have shared all your details with them.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
];

// Create or get the MeeMaw helper handoff for demo mode
export function createHelperDemoHandoff(): HandoffDossier {
  // Check if already exists
  if (demoHandoffStore.has(HELPER_HANDOFF_ID)) {
    return demoHandoffStore.get(HELPER_HANDOFF_ID)!;
  }

  const dossier: HandoffDossier = {
    handoff_id: HELPER_HANDOFF_ID,
    session_id: 'demo-session-dfw',
    status: 'pending',
    priority: 'urgent',

    conversation_summary:
      "Elderly passenger Margaret (MeeMaw) needs to change her flight from DFW to ORD due to a family emergency - her grandson is hospitalized. She's requesting a fee waiver for the $200 change fee, citing her Gold AAdvantage status and the emergency situation. She's currently at Terminal A and needs to get to Gate B22.",

    ai_actions_taken: [
      'Looked up reservation DFW123',
      'Found earlier flight option at 1:15 PM',
      'Explained standard $200 change fee',
      'Recognized family emergency keywords',
      'Family helper is monitoring location via helper link',
    ],

    sentiment_score: 'urgent',
    sentiment_reason: 'Family medical emergency with elderly passenger navigating airport alone',

    metadata: {
      confirmation_code: 'DFW123',
      flight_number: 'AA2847',
      flight_id: 'flight-dfw-001',
      passenger_name: 'Margaret Thompson (MeeMaw)',
      passenger_email: 'meemaw@email.com',
      passenger_phone: '(555) 867-5309',
      aadvantage_number: 'GOLD-789012',
      issue_type: 'emergency_change_fee_waiver',
    },

    reservation: {
      id: 'res-dfw-001',
      confirmation_code: 'DFW123',
      passenger: {
        id: 'pax-meemaw-001',
        first_name: 'Margaret',
        last_name: 'Thompson',
        email: 'meemaw@email.com',
        phone: '(555) 867-5309',
        aadvantage_number: 'GOLD-789012',
        preferences: {
          language: 'en',
          seat_preference: 'aisle',
        },
      },
      flights: [
        {
          id: 'flight-dfw-001',
          flight_number: 'AA2847',
          origin: 'DFW',
          destination: 'ORD',
          departure_time: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
          arrival_time: new Date(Date.now() + 7200000 + 10800000).toISOString(), // 3 hours flight
          gate: 'B22',
          status: 'scheduled',
          seat: '8D',
        },
      ],
      status: 'confirmed',
      created_at: new Date(Date.now() - 604800000).toISOString(),
    },

    transcript: MEEMAW_TRANSCRIPT,

    handoff_reason: 'authorization_required',
    handoff_reason_detail:
      'Elderly passenger requesting emergency fee waiver - requires supervisor authorization. Family member is actively monitoring via helper link.',

    suggested_first_response:
      "Hi Margaret, this is [Agent Name] from Elder Strolls Customer Care. I've reviewed your situation and I want to help get you to your grandson as quickly as possible. Given the family emergency and your Gold status with us, I'm authorized to waive the change fee. Let me rebook you on that 1:15 PM flight right now.",

    suggested_actions: [
      'Waive the $200 change fee due to family emergency',
      'Rebook to earlier flight AA1847 at 1:15 PM',
      'Assign aisle seat for easier mobility',
      'Arrange wheelchair assistance to new gate if needed',
      'Note: Family helper is tracking her location via helper link',
    ],

    created_at: new Date().toISOString(),
    bridge_message:
      "I'm connecting you with a specialist who can help with your fee waiver request. I've shared all your details and the emergency situation with them. They'll be with you in just a moment, Margaret.",
  };

  demoHandoffStore.set(HELPER_HANDOFF_ID, dossier);
  return dossier;
}

// Get MeeMaw handoff if it exists
export function getHelperDemoHandoff(): HandoffDossier | null {
  return demoHandoffStore.get(HELPER_HANDOFF_ID) || null;
}

// Check if MeeMaw handoff is active (pending or in_progress)
export function isHelperHandoffActive(): boolean {
  const handoff = demoHandoffStore.get(HELPER_HANDOFF_ID);
  if (!handoff) return false;
  return handoff.status === 'pending' || handoff.status === 'agent_joined' || handoff.status === 'in_progress';
}

// Simulate agent joining the MeeMaw handoff
export function simulateAgentJoinHelperHandoff(): HandoffDossier | null {
  const handoff = demoHandoffStore.get(HELPER_HANDOFF_ID);
  if (!handoff) return null;

  handoff.status = 'agent_joined';
  handoff.agent_joined_at = new Date().toISOString();
  demoHandoffStore.set(HELPER_HANDOFF_ID, handoff);
  return handoff;
}

// Reset helper handoff for demo restart
export function resetHelperDemoHandoff(): void {
  demoHandoffStore.delete(HELPER_HANDOFF_ID);
}
