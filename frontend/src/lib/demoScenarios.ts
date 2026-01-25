// Demo Scenarios for Elder Strolls
// Each scenario demonstrates different features through simulated voice conversations

export interface DemoScenario {
  id: string;
  name: string;
  shortDescription: string;
  badge?: string;

  passenger: {
    firstName: string;
    lastName: string;
    nickname?: string;
    aadvantageStatus: 'Gold' | 'Platinum' | 'Executive Platinum' | null;
    language: 'en' | 'es';
  };

  reservation: {
    confirmationCode: string;
    flights: Array<{
      flightNumber: string;
      origin: string;
      destination: string;
      departureTime: string;
      arrivalTime: string;
      gate: string;
      seat: string;
      status: 'on_time' | 'delayed' | 'boarding' | 'cancelled';
    }>;
  };

  transcript: Array<{
    role: 'agent' | 'user';
    content: string;
    delayMs: number;
    event?: 'handoff' | 'alert' | 'action' | 'rebooking';
  }>;

  features: string[];
}

// Helper to create departure time relative to now
function getRelativeTime(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  // Scenario 1: Happy Path - On-Time Flight
  {
    id: 'happy-path',
    name: 'Happy Path',
    shortDescription: 'On-time flight, gate directions',
    badge: undefined,

    passenger: {
      firstName: 'Margaret',
      lastName: 'Johnson',
      nickname: 'MeeMaw',
      aadvantageStatus: 'Gold',
      language: 'en',
    },

    reservation: {
      confirmationCode: 'MAWFLY',
      flights: [
        {
          flightNumber: 'AA1845',
          origin: 'DFW',
          destination: 'ORD',
          departureTime: getRelativeTime(90),
          arrivalTime: getRelativeTime(210),
          gate: 'B22',
          seat: '14A',
          status: 'on_time',
        },
      ],
    },

    transcript: [
      {
        role: 'user',
        content: 'Hello, I need help checking my flight status',
        delayMs: 0,
      },
      {
        role: 'agent',
        content: "Hi Margaret! I found your reservation MAWFLY. Flight AA1845 to Chicago O'Hare is on time, departing from Gate B22 in about 90 minutes.",
        delayMs: 2000,
      },
      {
        role: 'user',
        content: 'Where is Gate B22?',
        delayMs: 4000,
      },
      {
        role: 'agent',
        content: "Gate B22 is in Terminal B. From your current location, it's about a 12-minute walk. Head to the Skylink train and take it to Terminal B.",
        delayMs: 3000,
      },
      {
        role: 'user',
        content: 'Is there a restroom nearby?',
        delayMs: 4000,
      },
      {
        role: 'agent',
        content: "Yes! There's a restroom near Gate B20, just 2 gates before yours. About 50 meters from Gate B22.",
        delayMs: 2500,
      },
    ],

    features: ['Flight lookup', 'Gate directions', 'POI navigation'],
  },

  // Scenario 2: Running Late - Urgent Alert
  {
    id: 'running-late',
    name: 'Running Late',
    shortDescription: 'Urgent alert, wheelchair assistance',
    badge: 'Urgent',

    passenger: {
      firstName: 'Dorothy',
      lastName: 'Williams',
      nickname: undefined,
      aadvantageStatus: null,
      language: 'en',
    },

    reservation: {
      confirmationCode: 'LATEDY',
      flights: [
        {
          flightNumber: 'AA456',
          origin: 'DFW',
          destination: 'LAX',
          departureTime: getRelativeTime(20),
          arrivalTime: getRelativeTime(180),
          gate: 'C15',
          seat: '8C',
          status: 'boarding',
        },
      ],
    },

    transcript: [
      {
        role: 'agent',
        content: "Hi Dorothy, this is Elder Strolls. Your flight AA456 to Los Angeles boards in 20 minutes and you're still at security. Would you like me to request wheelchair assistance?",
        delayMs: 0,
        event: 'alert',
      },
      {
        role: 'user',
        content: "Oh my! Yes please, I'm moving as fast as I can.",
        delayMs: 3500,
      },
      {
        role: 'agent',
        content: "I've requested priority wheelchair assistance. An agent will meet you at the security exit. Your gate C15 is a 15-minute walk, but with assistance you'll make it.",
        delayMs: 3000,
        event: 'action',
      },
      {
        role: 'user',
        content: 'Thank you so much!',
        delayMs: 3000,
      },
      {
        role: 'agent',
        content: "I'm also notifying your family that you may need help. Stay calm, you've got this!",
        delayMs: 2500,
      },
    ],

    features: ['Outbound call', 'Wheelchair request', 'Urgent alert', 'Family notification'],
  },

  // Scenario 3: Flight Delayed - IROP Rebooking
  {
    id: 'flight-delayed',
    name: 'Flight Delayed',
    shortDescription: 'IROP rebooking, connection at risk',
    badge: 'IROP',

    passenger: {
      firstName: 'Robert',
      lastName: 'Chen',
      nickname: undefined,
      aadvantageStatus: 'Platinum',
      language: 'en',
    },

    reservation: {
      confirmationCode: 'DLYCHK',
      flights: [
        {
          flightNumber: 'AA789',
          origin: 'DFW',
          destination: 'JFK',
          departureTime: getRelativeTime(180),
          arrivalTime: getRelativeTime(420),
          gate: 'A8',
          seat: '3A',
          status: 'delayed',
        },
        {
          flightNumber: 'AA100',
          origin: 'JFK',
          destination: 'LHR',
          departureTime: getRelativeTime(480),
          arrivalTime: getRelativeTime(900),
          gate: 'TBD',
          seat: '12J',
          status: 'on_time',
        },
      ],
    },

    transcript: [
      {
        role: 'user',
        content: 'I just got a delay notification. What are my options?',
        delayMs: 0,
      },
      {
        role: 'agent',
        content: "I see your flight AA789 to JFK is delayed 3 hours due to weather. This puts your London connection at HIGH risk - you'd have only 30 minutes to connect.",
        delayMs: 3000,
        event: 'alert',
      },
      {
        role: 'user',
        content: "That's too tight. Can you rebook me?",
        delayMs: 4000,
      },
      {
        role: 'agent',
        content: 'I have two options: 1) AA234 leaving in 2 hours, connects through Chicago with a comfortable 2-hour layover, arriving London same time. 2) Stay on AA789 and I\'ll rebook your London flight to the morning.',
        delayMs: 4500,
        event: 'rebooking',
      },
      {
        role: 'user',
        content: 'Option 1 please.',
        delayMs: 3500,
      },
      {
        role: 'agent',
        content: "Done! I've rebooked you on AA234 at 2:15 PM. New gate is A12. Your London connection is now confirmed. Would you like me to notify anyone?",
        delayMs: 3000,
        event: 'action',
      },
    ],

    features: ['IROP delay', 'Connection risk', 'Rebooking options', 'Flight change'],
  },

  // Scenario 4: Fee Waiver - Agent Handoff
  {
    id: 'fee-waiver',
    name: 'Fee Waiver',
    shortDescription: 'Emergency change, agent handoff',
    badge: 'Handoff',

    passenger: {
      firstName: 'Patricia',
      lastName: 'Thompson',
      nickname: undefined,
      aadvantageStatus: 'Platinum',
      language: 'en',
    },

    reservation: {
      confirmationCode: 'FEEWVR',
      flights: [
        {
          flightNumber: 'AA2847',
          origin: 'DFW',
          destination: 'ORD',
          departureTime: getRelativeTime(240),
          arrivalTime: getRelativeTime(360),
          gate: 'D12',
          seat: '6A',
          status: 'on_time',
        },
      ],
    },

    transcript: [
      {
        role: 'user',
        content: 'I need to change my flight. My grandson is in the hospital.',
        delayMs: 0,
      },
      {
        role: 'agent',
        content: "I'm so sorry to hear that, Patricia. I can help you change your flight. Let me check same-day options... I found AA1234 departing in 3 hours.",
        delayMs: 3500,
      },
      {
        role: 'user',
        content: "What about the change fee? I can't afford $200 right now with hospital bills.",
        delayMs: 4000,
      },
      {
        role: 'agent',
        content: "I completely understand. Given your 15-year loyalty as a Platinum member and these circumstances, I'd like to connect you with an agent who can review a fee waiver. One moment...",
        delayMs: 4000,
        event: 'handoff',
      },
      {
        role: 'agent',
        content: "I'm connecting you with Agent Sarah. She has your full conversation history and account details.",
        delayMs: 3000,
      },
      {
        role: 'agent',
        content: "Hi Patricia, I'm Sarah. I've reviewed your situation and approved the fee waiver. Let me complete this rebooking for you.",
        delayMs: 4000,
        event: 'action',
      },
    ],

    features: ['Emergency situation', 'Sentiment detection', 'Agent handoff', 'Fee waiver'],
  },

  // Scenario 5: Spanish Speaker - Bilingual Support
  {
    id: 'spanish-speaker',
    name: 'Hablante de Espanol',
    shortDescription: 'Bilingual support, seat change',
    badge: 'Espanol',

    passenger: {
      firstName: 'Maria',
      lastName: 'Garcia',
      nickname: undefined,
      aadvantageStatus: null,
      language: 'es',
    },

    reservation: {
      confirmationCode: 'HABLA1',
      flights: [
        {
          flightNumber: 'AA567',
          origin: 'DFW',
          destination: 'MIA',
          departureTime: getRelativeTime(120),
          arrivalTime: getRelativeTime(270),
          gate: 'D8',
          seat: '22B',
          status: 'on_time',
        },
      ],
    },

    transcript: [
      {
        role: 'user',
        content: 'Hola, necesito ayuda con mi vuelo',
        delayMs: 0,
      },
      {
        role: 'agent',
        content: 'Hola Maria! Soy tu asistente de Elder Strolls. Encontre tu reserva HABLA1. Tu vuelo AA567 a Miami sale de la puerta D8 en 2 horas. En que mas puedo ayudarte?',
        delayMs: 3500,
      },
      {
        role: 'user',
        content: 'Puedo cambiar mi asiento? Quiero ventanilla.',
        delayMs: 4000,
      },
      {
        role: 'agent',
        content: 'Por supuesto. Tengo disponible el asiento 14A, ventanilla con buena vista. Te lo asigno?',
        delayMs: 3000,
      },
      {
        role: 'user',
        content: 'Si, por favor',
        delayMs: 2500,
      },
      {
        role: 'agent',
        content: 'Listo! Tu nuevo asiento es 14A. Te he enviado un correo con la confirmacion. Necesitas ayuda para llegar a la puerta?',
        delayMs: 3000,
        event: 'action',
      },
    ],

    features: ['Spanish detection', 'Bilingual conversation', 'Seat selection'],
  },
];

// Helper to get a scenario by ID
export function getScenarioById(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((s) => s.id === id);
}

// Convert scenario reservation to the format used by existing components
export function scenarioToReservation(scenario: DemoScenario) {
  return {
    id: `demo-${scenario.id}`,
    confirmation_code: scenario.reservation.confirmationCode,
    passenger: {
      id: `demo-pax-${scenario.id}`,
      first_name: scenario.passenger.firstName,
      last_name: scenario.passenger.lastName,
      nickname: scenario.passenger.nickname,
      email: `${scenario.passenger.firstName.toLowerCase()}.${scenario.passenger.lastName.toLowerCase()}@email.com`,
      phone: '(555) 123-4567',
      aadvantage_number: scenario.passenger.aadvantageStatus ? '1234567890' : undefined,
      preferences: {
        language: scenario.passenger.language,
        seat_preference: 'window' as const,
      },
    },
    flights: scenario.reservation.flights.map((f, idx) => ({
      id: `demo-flight-${scenario.id}-${idx}`,
      flight_number: f.flightNumber,
      origin: f.origin,
      destination: f.destination,
      departure_time: f.departureTime,
      arrival_time: f.arrivalTime,
      gate: f.gate,
      seat: f.seat,
      status: f.status === 'on_time' ? 'scheduled' as const :
              f.status === 'boarding' ? 'boarding' as const :
              f.status === 'delayed' ? 'delayed' as const : 'cancelled' as const,
    })),
    status: 'confirmed' as const,
    created_at: new Date().toISOString(),
  };
}
