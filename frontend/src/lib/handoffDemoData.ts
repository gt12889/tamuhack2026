// Demo data for agent handoff feature
import type {
  HandoffDossier,
  HandoffTranscriptMessage,
  HandoffMetadata,
  HandoffReason,
  SentimentScore,
} from '@/types';

// Type for live transcript messages from ElevenLabs
export interface LiveTranscriptMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
  isFinal: boolean;
}

// Convert live transcript messages to handoff format
function convertTranscriptMessages(liveMessages: LiveTranscriptMessage[]): HandoffTranscriptMessage[] {
  return liveMessages
    .filter((msg) => msg.isFinal) // Only include finalized messages
    .map((msg, index) => ({
      id: msg.id || `msg-${index}`,
      role: msg.role === 'agent' ? 'ai' : 'user', // Map 'agent' to 'ai'
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    }));
}

// Extract context from conversation transcript
interface ExtractedContext {
  confirmationCode?: string;
  flightNumber?: string;
  passengerName?: string;
  issueType?: string;
  isUrgent: boolean;
  urgencyKeywords: string[];
}

function extractContextFromTranscript(messages: LiveTranscriptMessage[]): ExtractedContext {
  const allText = messages.map((m) => m.content).join(' ');
  const userText = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ');

  // Extract confirmation code (6 character alphanumeric)
  const confirmationMatch = allText.match(/\b([A-Z0-9]{6})\b/i);
  const confirmationCode = confirmationMatch ? confirmationMatch[1].toUpperCase() : undefined;

  // Extract flight number (AA followed by digits)
  const flightMatch = allText.match(/\b(AA\s*\d{1,4})\b/i);
  const flightNumber = flightMatch ? flightMatch[1].replace(/\s/g, '').toUpperCase() : undefined;

  // Extract passenger name from common phrases
  let passengerName: string | undefined;
  const namePatterns = [
    /(?:this is|my name is|i'm|i am|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:hello,?\s*)?(?:this is\s+)?([A-Z][a-z]+)\s+(?:here|speaking|calling)/i,
  ];
  for (const pattern of namePatterns) {
    const match = userText.match(pattern);
    if (match) {
      passengerName = match[1];
      break;
    }
  }

  // Detect urgency keywords
  const urgencyKeywords: string[] = [];
  const urgencyPatterns = [
    { pattern: /\b(emergency|emergencies)\b/i, keyword: 'emergency' },
    { pattern: /\b(hospital|hospitalized)\b/i, keyword: 'hospital' },
    { pattern: /\b(urgent|urgently)\b/i, keyword: 'urgent' },
    { pattern: /\b(asap|immediately|right now)\b/i, keyword: 'immediate' },
    { pattern: /\b(accident|injured|injury)\b/i, keyword: 'accident' },
    { pattern: /\b(medical|health|sick|ill)\b/i, keyword: 'medical' },
    { pattern: /\b(death|dying|passed away|funeral)\b/i, keyword: 'bereavement' },
    { pattern: /\b(family member|daughter|son|mother|father|grandson|granddaughter|wife|husband)\b/i, keyword: 'family' },
  ];

  for (const { pattern, keyword } of urgencyPatterns) {
    if (pattern.test(allText) && !urgencyKeywords.includes(keyword)) {
      urgencyKeywords.push(keyword);
    }
  }

  const isUrgent = urgencyKeywords.length > 0;

  // Determine issue type from keywords
  let issueType: string | undefined;
  if (/\b(change|rebook|reschedule|different flight|earlier flight|later flight)\b/i.test(allText)) {
    issueType = isUrgent ? 'emergency_change' : 'flight_change';
  } else if (/\b(cancel|cancellation|refund)\b/i.test(allText)) {
    issueType = 'cancellation';
  } else if (/\b(fee|waive|waiver)\b/i.test(allText)) {
    issueType = 'fee_waiver';
  } else if (/\b(upgrade|first class|business class)\b/i.test(allText)) {
    issueType = 'upgrade_request';
  } else if (/\b(complaint|complain|upset|frustrated|angry)\b/i.test(allText)) {
    issueType = 'complaint';
  } else if (/\b(help|assist|assistance|wheelchair|special)\b/i.test(allText)) {
    issueType = 'special_assistance';
  }

  return {
    confirmationCode,
    flightNumber,
    passengerName,
    issueType,
    isUrgent,
    urgencyKeywords,
  };
}

// Generate a contextual summary from live messages
function generateContextualSummary(
  messages: LiveTranscriptMessage[],
  context: ExtractedContext
): string {
  const userMessages = messages.filter((m) => m.role === 'user' && m.isFinal);

  if (userMessages.length === 0) {
    return 'Customer initiated conversation - context being gathered.';
  }

  let summary = '';

  if (context.passengerName) {
    summary += `Customer ${context.passengerName}`;
  } else {
    summary += 'Customer';
  }

  if (context.flightNumber) {
    summary += ` regarding flight ${context.flightNumber}`;
  }

  if (context.confirmationCode) {
    summary += ` (confirmation: ${context.confirmationCode})`;
  }

  if (context.issueType) {
    const issueDescriptions: Record<string, string> = {
      emergency_change: ' needs an emergency flight change',
      flight_change: ' is requesting a flight change',
      cancellation: ' is requesting a cancellation or refund',
      fee_waiver: ' is requesting a fee waiver',
      upgrade_request: ' is requesting an upgrade',
      complaint: ' has a complaint',
      special_assistance: ' needs special assistance',
    };
    summary += issueDescriptions[context.issueType] || ' needs assistance';
  } else {
    summary += ' needs assistance';
  }

  if (context.isUrgent && context.urgencyKeywords.length > 0) {
    summary += `. Urgency indicators: ${context.urgencyKeywords.join(', ')}`;
  }

  summary += '.';

  // Add last user message as context
  const lastUserMessage = userMessages[userMessages.length - 1];
  if (lastUserMessage && lastUserMessage.content.length > 20) {
    const truncated = lastUserMessage.content.length > 100
      ? lastUserMessage.content.substring(0, 100) + '...'
      : lastUserMessage.content;
    summary += ` Last message: "${truncated}"`;
  }

  return summary;
}

// Generate suggested responses based on context
function generateSuggestedResponses(context: ExtractedContext): {
  firstResponse: string;
  actions: string[];
} {
  const name = context.passengerName || 'the customer';

  if (context.isUrgent) {
    return {
      firstResponse: `Hi ${context.passengerName || 'there'}, this is [Agent Name] from Elder Strolls. I've reviewed your situation and I want to help you as quickly as possible. ${context.urgencyKeywords.includes('family') || context.urgencyKeywords.includes('hospital') || context.urgencyKeywords.includes('medical') ? "I understand this is a difficult time, and I'm here to assist." : "Let me see what I can do for you right away."}`,
      actions: [
        context.issueType === 'emergency_change' || context.issueType === 'fee_waiver'
          ? 'Consider waiving change fees due to emergency circumstances'
          : 'Prioritize resolving the urgent issue',
        'Review available options for immediate assistance',
        'Document the emergency situation in customer notes',
        'Offer expedited service where possible',
      ],
    };
  }

  return {
    firstResponse: `Hello ${context.passengerName || 'there'}, this is [Agent Name] from Elder Strolls. I've reviewed your conversation and I'm here to help. How can I assist you today?`,
    actions: [
      'Review the customer\'s reservation details',
      'Address the primary concern raised',
      'Check for any loyalty status or preferences',
      'Ensure customer satisfaction before closing',
    ],
  };
}

// Create a contextual handoff from live conversation
export function createContextualHandoff(
  handoffId: string,
  liveMessages?: LiveTranscriptMessage[]
): HandoffDossier {
  // Check if we have enough live messages to use
  const finalizedMessages = liveMessages?.filter((m) => m.isFinal) || [];

  // Fall back to static demo if no meaningful conversation
  if (finalizedMessages.length < 2) {
    return getOrCreateDemoHandoff(handoffId);
  }

  // Extract context from the live conversation
  const context = extractContextFromTranscript(finalizedMessages);
  const transcript = convertTranscriptMessages(finalizedMessages);
  const summary = generateContextualSummary(finalizedMessages, context);
  const { firstResponse, actions } = generateSuggestedResponses(context);

  // Determine sentiment and priority
  const sentiment: SentimentScore = context.isUrgent
    ? 'urgent'
    : context.issueType === 'complaint'
    ? 'frustrated'
    : 'neutral';

  const priority: 'normal' | 'high' | 'urgent' = context.isUrgent
    ? 'urgent'
    : context.issueType === 'complaint'
    ? 'high'
    : 'normal';

  // Determine handoff reason
  const handoffReason: HandoffReason = context.isUrgent
    ? 'authorization_required'
    : context.issueType === 'complaint'
    ? 'customer_request'
    : 'complex_issue';

  // Build the dossier
  const dossier: HandoffDossier = {
    handoff_id: handoffId,
    session_id: `session-${Date.now()}`,
    status: 'pending',
    priority,

    conversation_summary: summary,

    ai_actions_taken: [
      'Engaged with customer via voice AI',
      context.confirmationCode ? `Discussed reservation ${context.confirmationCode}` : 'Gathered customer information',
      context.flightNumber ? `Referenced flight ${context.flightNumber}` : undefined,
      context.isUrgent ? 'Recognized urgency in customer situation' : undefined,
      'Determined human assistance required',
    ].filter(Boolean) as string[],

    sentiment_score: sentiment,
    sentiment_reason: context.isUrgent
      ? `Customer expressed urgency: ${context.urgencyKeywords.join(', ')}`
      : `Customer sentiment detected as ${sentiment} based on conversation tone`,

    metadata: {
      confirmation_code: context.confirmationCode,
      flight_number: context.flightNumber,
      passenger_name: context.passengerName,
      issue_type: context.issueType,
    },

    reservation: undefined, // No reservation data from live conversation

    transcript,

    handoff_reason: handoffReason,
    handoff_reason_detail: context.isUrgent
      ? `Urgent customer request requiring immediate human assistance - ${context.urgencyKeywords.join(', ')}`
      : 'Customer conversation requires human agent intervention',

    suggested_first_response: firstResponse,
    suggested_actions: actions,

    created_at: new Date().toISOString(),
    bridge_message: "I'm connecting you with a specialist who can help with your request. I've shared our conversation with them so you won't need to repeat anything. They'll be with you in just a moment.",
  };

  // Store in demo handoff store
  demoHandoffStore.set(handoffId, dossier);

  return dossier;
}

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
