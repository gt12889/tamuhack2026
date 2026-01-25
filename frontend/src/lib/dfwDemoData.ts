// DFW Airport Demo Data for MeeMaw Navigation Demo

export interface DFWWaypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  terminal: string;
  instruction: string;
  landmarks: string[];
  estimatedTimeFromStart: number; // seconds
}

// DFW Airport walkable path waypoints
// Based on actual DFW horseshoe terminal layout (center: 32.8998, -97.0403)
// Terminal A is northwest, Terminal B is west-southwest
// Coordinates follow actual terminal building footprints and walkways
export const DFW_JOURNEY_WAYPOINTS: DFWWaypoint[] = [
  // Terminal A - Landside (Entrance/Check-in area)
  {
    id: 'entrance',
    name: 'Terminal A Entrance',
    lat: 32.9022,
    lng: -97.0501,
    terminal: 'A',
    instruction: 'Enter Terminal A through the automatic doors. Head to check-in.',
    landmarks: ['Curbside drop-off', 'AA Welcome sign'],
    estimatedTimeFromStart: 0,
  },
  {
    id: 'checkin',
    name: 'Terminal A Check-in Hall',
    lat: 32.9016,
    lng: -97.0493,
    terminal: 'A',
    instruction: 'Walk past the check-in counters toward Security on your right.',
    landmarks: ['AA check-in kiosks', 'Baggage drop counters'],
    estimatedTimeFromStart: 60,
  },
  // Terminal A - Security
  {
    id: 'security_approach',
    name: 'Security Checkpoint',
    lat: 32.9008,
    lng: -97.0483,
    terminal: 'A',
    instruction: 'Enter the TSA security line. Have your ID and boarding pass ready.',
    landmarks: ['TSA PreCheck lane on left', 'Security queue'],
    estimatedTimeFromStart: 120,
  },
  {
    id: 'security',
    name: 'Security Screening',
    lat: 32.8998,
    lng: -97.0472,
    terminal: 'A',
    instruction: 'Remove shoes and belt. Place items in bins.',
    landmarks: ['X-ray conveyor', 'Body scanner'],
    estimatedTimeFromStart: 300,
  },
  // Terminal A - Airside Concourse (curved corridor)
  {
    id: 'post_security',
    name: 'Terminal A Concourse Entry',
    lat: 32.8988,
    lng: -97.0462,
    terminal: 'A',
    instruction: 'You are now airside. Follow signs to Skylink or walk to Terminal B.',
    landmarks: ['Gate A10', 'Information desk'],
    estimatedTimeFromStart: 420,
  },
  {
    id: 'a_concourse_south',
    name: 'Terminal A South Concourse',
    lat: 32.8975,
    lng: -97.0455,
    terminal: 'A',
    instruction: 'Continue along the curved concourse toward Skylink station.',
    landmarks: ['Gate A22', 'Starbucks', 'Newsstand'],
    estimatedTimeFromStart: 500,
  },
  // Skylink Station A (elevated, at terminal midpoint)
  {
    id: 'skylink_a_approach',
    name: 'Skylink Station A Entrance',
    lat: 32.8963,
    lng: -97.0448,
    terminal: 'A',
    instruction: 'Take the escalator UP to the Skylink platform.',
    landmarks: ['Skylink signs', 'Escalators', 'Elevator'],
    estimatedTimeFromStart: 560,
  },
  {
    id: 'skylink_a',
    name: 'Skylink Platform - Terminal A',
    lat: 32.8958,
    lng: -97.0445,
    terminal: 'A',
    instruction: 'Board the Skylink train. Take the CLOCKWISE train toward Terminal B.',
    landmarks: ['Platform screen doors', 'Departure display'],
    estimatedTimeFromStart: 600,
  },
  // Skylink elevated track (curves around the horseshoe)
  {
    id: 'skylink_transit_1',
    name: 'Skylink - Departing Terminal A',
    lat: 32.8948,
    lng: -97.0440,
    terminal: 'Skylink',
    instruction: 'Train departing. Next stop: Terminal B.',
    landmarks: ['View of tarmac', 'Aircraft'],
    estimatedTimeFromStart: 650,
  },
  {
    id: 'skylink_transit_2',
    name: 'Skylink - Approaching Terminal B',
    lat: 32.8935,
    lng: -97.0432,
    terminal: 'Skylink',
    instruction: 'Approaching Terminal B. Prepare to exit.',
    landmarks: ['Terminal B ahead'],
    estimatedTimeFromStart: 700,
  },
  // Terminal B - Skylink Station
  {
    id: 'skylink_b',
    name: 'Skylink Platform - Terminal B',
    lat: 32.8922,
    lng: -97.0425,
    terminal: 'B',
    instruction: 'Exit the train. Take the escalator DOWN to the concourse.',
    landmarks: ['Exit signs', 'Escalators down'],
    estimatedTimeFromStart: 720,
  },
  {
    id: 'skylink_b_exit',
    name: 'Terminal B Skylink Exit',
    lat: 32.8915,
    lng: -97.0420,
    terminal: 'B',
    instruction: 'At the bottom, turn LEFT toward Gates B20-B30.',
    landmarks: ['Directory board', 'Gate direction signs'],
    estimatedTimeFromStart: 780,
  },
  // Terminal B - Concourse (walking to gate along curved corridor)
  {
    id: 'b_concourse_start',
    name: 'Terminal B Concourse',
    lat: 32.8905,
    lng: -97.0413,
    terminal: 'B',
    instruction: 'Walk along the concourse. Gate B22 is ahead.',
    landmarks: ['Gate B15', 'Moving walkway'],
    estimatedTimeFromStart: 840,
  },
  {
    id: 'b_concourse_mid',
    name: 'Terminal B - Gate B20 Area',
    lat: 32.8895,
    lng: -97.0405,
    terminal: 'B',
    instruction: 'Continue past Gate B20. Almost there!',
    landmarks: ['Gate B20', 'Restrooms', 'Water fountain'],
    estimatedTimeFromStart: 900,
  },
  {
    id: 'b_gate_approach',
    name: 'Approaching Gate B22',
    lat: 32.8888,
    lng: -97.0398,
    terminal: 'B',
    instruction: 'Gate B22 is on your LEFT.',
    landmarks: ['Gate B21', 'Seating area visible'],
    estimatedTimeFromStart: 940,
  },
  {
    id: 'gate_b22',
    name: 'Gate B22',
    lat: 32.8882,
    lng: -97.0392,
    terminal: 'B',
    instruction: 'You have arrived at Gate B22! Find a seat and wait for boarding.',
    landmarks: ['Gate desk', 'Boarding door', 'Charging stations'],
    estimatedTimeFromStart: 960,
  },
];

export const DFW_GATE_LOCATION = {
  lat: 32.8882,
  lng: -97.0392,
  gate: 'B22',
  terminal: 'B',
};

export const DFW_DEMO_RESERVATION = {
  id: 'dfw-demo-res-001',
  confirmation_code: 'CZYBYU',
  passenger: {
    id: 'dfw-demo-pax-001',
    first_name: 'Margaret',
    last_name: 'Johnson',
    nickname: 'MeeMaw',
    email: 'margaret.johnson@email.com',
    phone: '(555) 123-4567',
    aadvantage_number: '1234567890',
    preferences: {
      language: 'en' as const,
      seat_preference: 'window' as const,
    },
  },
  flights: [{
    id: 'dfw-demo-flight-001',
    flight_number: 'AA1845',
    origin: 'DFW',
    destination: 'ORD',
    departure_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    arrival_time: new Date(Date.now() + 210 * 60 * 1000).toISOString(),
    gate: 'B22',
    seat: '14A',
    status: 'boarding' as const,
  }],
  status: 'confirmed' as const,
  created_at: new Date().toISOString(),
};

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get waypoint by progress (0-1)
export function getWaypointByProgress(progress: number): {
  current: DFWWaypoint;
  next: DFWWaypoint | null;
  segmentProgress: number;
} {
  const totalTime = DFW_JOURNEY_WAYPOINTS[DFW_JOURNEY_WAYPOINTS.length - 1].estimatedTimeFromStart;
  const currentTime = progress * totalTime;

  let current = DFW_JOURNEY_WAYPOINTS[0];
  let next: DFWWaypoint | null = DFW_JOURNEY_WAYPOINTS[1] || null;
  let segmentProgress = 0;

  for (let i = 0; i < DFW_JOURNEY_WAYPOINTS.length - 1; i++) {
    const waypoint = DFW_JOURNEY_WAYPOINTS[i];
    const nextWaypoint = DFW_JOURNEY_WAYPOINTS[i + 1];

    if (currentTime >= waypoint.estimatedTimeFromStart && currentTime < nextWaypoint.estimatedTimeFromStart) {
      current = waypoint;
      next = nextWaypoint;
      const segmentDuration = nextWaypoint.estimatedTimeFromStart - waypoint.estimatedTimeFromStart;
      segmentProgress = (currentTime - waypoint.estimatedTimeFromStart) / segmentDuration;
      break;
    }
  }

  // At or past the final waypoint
  if (progress >= 1) {
    current = DFW_JOURNEY_WAYPOINTS[DFW_JOURNEY_WAYPOINTS.length - 1];
    next = null;
    segmentProgress = 1;
  }

  return { current, next, segmentProgress };
}

// Interpolate position between two waypoints
export function interpolatePosition(
  from: DFWWaypoint,
  to: DFWWaypoint | null,
  progress: number
): { lat: number; lng: number } {
  if (!to || progress >= 1) {
    return { lat: from.lat, lng: from.lng };
  }

  return {
    lat: from.lat + (to.lat - from.lat) * progress,
    lng: from.lng + (to.lng - from.lng) * progress,
  };
}
