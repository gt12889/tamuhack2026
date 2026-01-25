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

// Points of Interest at DFW Airport (bathrooms, food, services)
export interface DFWPointOfInterest {
  id: string;
  name: string;
  type: 'restroom' | 'food' | 'water' | 'charging' | 'medical' | 'info' | 'lounge';
  lat: number;
  lng: number;
  terminal: string;
  nearGate?: string;
  description: string;
  hours?: string;
}

export const DFW_POINTS_OF_INTEREST: DFWPointOfInterest[] = [
  // Terminal A - Restrooms
  {
    id: 'restroom-a-security',
    name: 'Restroom (Post-Security)',
    type: 'restroom',
    lat: 32.8990,
    lng: -97.0465,
    terminal: 'A',
    nearGate: 'A12',
    description: 'Restroom located just past security checkpoint on the right.',
  },
  {
    id: 'restroom-a-south',
    name: 'Restroom (A Concourse South)',
    type: 'restroom',
    lat: 32.8970,
    lng: -97.0452,
    terminal: 'A',
    nearGate: 'A25',
    description: 'Restroom near Gate A25, by Starbucks.',
  },
  // Terminal B - Restrooms
  {
    id: 'restroom-b-skylink',
    name: 'Restroom (Near Skylink)',
    type: 'restroom',
    lat: 32.8910,
    lng: -97.0418,
    terminal: 'B',
    nearGate: 'B15',
    description: 'Restroom at the bottom of Skylink escalators.',
  },
  {
    id: 'restroom-b-gate20',
    name: 'Restroom (Gate B20 Area)',
    type: 'restroom',
    lat: 32.8893,
    lng: -97.0403,
    terminal: 'B',
    nearGate: 'B20',
    description: 'Restroom between Gates B19 and B21.',
  },
  // Terminal A - Food
  {
    id: 'food-starbucks-a',
    name: 'Starbucks',
    type: 'food',
    lat: 32.8973,
    lng: -97.0454,
    terminal: 'A',
    nearGate: 'A22',
    description: 'Coffee and light snacks. Near Gate A22.',
    hours: '5:00 AM - 9:00 PM',
  },
  {
    id: 'food-mcdonalds-a',
    name: "McDonald's",
    type: 'food',
    lat: 32.8985,
    lng: -97.0460,
    terminal: 'A',
    nearGate: 'A15',
    description: 'Fast food. Near Gate A15.',
    hours: '6:00 AM - 10:00 PM',
  },
  // Terminal B - Food
  {
    id: 'food-whataburger-b',
    name: 'Whataburger',
    type: 'food',
    lat: 32.8900,
    lng: -97.0410,
    terminal: 'B',
    nearGate: 'B17',
    description: 'Texas-style burgers. Near Gate B17.',
    hours: '6:00 AM - 10:00 PM',
  },
  {
    id: 'food-starbucks-b',
    name: 'Starbucks',
    type: 'food',
    lat: 32.8890,
    lng: -97.0400,
    terminal: 'B',
    nearGate: 'B21',
    description: 'Coffee and light snacks. Near Gate B21.',
    hours: '5:00 AM - 9:00 PM',
  },
  // Water Fountains
  {
    id: 'water-a-security',
    name: 'Water Fountain',
    type: 'water',
    lat: 32.8992,
    lng: -97.0467,
    terminal: 'A',
    nearGate: 'A10',
    description: 'Water fountain and bottle refill station post-security.',
  },
  {
    id: 'water-b-gate20',
    name: 'Water Fountain',
    type: 'water',
    lat: 32.8894,
    lng: -97.0404,
    terminal: 'B',
    nearGate: 'B20',
    description: 'Water fountain near Gate B20 restrooms.',
  },
  // Charging Stations
  {
    id: 'charging-a-south',
    name: 'Charging Station',
    type: 'charging',
    lat: 32.8968,
    lng: -97.0450,
    terminal: 'A',
    nearGate: 'A26',
    description: 'Free device charging station with USB and outlets.',
  },
  {
    id: 'charging-b-gate22',
    name: 'Charging Station',
    type: 'charging',
    lat: 32.8884,
    lng: -97.0394,
    terminal: 'B',
    nearGate: 'B22',
    description: 'Charging stations at Gate B22 seating area.',
  },
  // Medical / First Aid
  {
    id: 'medical-a',
    name: 'First Aid Station',
    type: 'medical',
    lat: 32.8995,
    lng: -97.0470,
    terminal: 'A',
    nearGate: 'A8',
    description: 'Medical assistance and first aid. Staffed 24/7.',
  },
  // Information Desks
  {
    id: 'info-a-security',
    name: 'Information Desk',
    type: 'info',
    lat: 32.8988,
    lng: -97.0462,
    terminal: 'A',
    nearGate: 'A10',
    description: 'Airport information and assistance desk.',
  },
  {
    id: 'info-b-skylink',
    name: 'Information Desk',
    type: 'info',
    lat: 32.8912,
    lng: -97.0419,
    terminal: 'B',
    nearGate: 'B15',
    description: 'Airport information desk near Skylink exit.',
  },
];

// Get nearby POIs from a location
export function getNearbyPOIs(
  lat: number,
  lng: number,
  type?: DFWPointOfInterest['type'],
  maxDistance: number = 500 // meters
): Array<DFWPointOfInterest & { distance: number }> {
  return DFW_POINTS_OF_INTEREST
    .filter(poi => !type || poi.type === type)
    .map(poi => ({
      ...poi,
      distance: calculateDistance(lat, lng, poi.lat, poi.lng),
    }))
    .filter(poi => poi.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}

// Get directions to nearest POI of a type
export function getDirectionsToPOI(
  currentLat: number,
  currentLng: number,
  poiType: DFWPointOfInterest['type']
): { poi: DFWPointOfInterest; distance: number; directions: string } | null {
  const nearby = getNearbyPOIs(currentLat, currentLng, poiType, 1000);
  if (nearby.length === 0) return null;

  const nearest = nearby[0];
  const distanceMeters = Math.round(nearest.distance);
  const walkingTime = Math.ceil(distanceMeters / 80); // ~80m/min normal pace

  // Determine relative direction
  const latDiff = nearest.lat - currentLat;
  const lngDiff = nearest.lng - currentLng;
  let direction = '';

  if (Math.abs(latDiff) > Math.abs(lngDiff)) {
    direction = latDiff > 0 ? 'ahead' : 'behind you';
  } else {
    direction = lngDiff > 0 ? 'on your right' : 'on your left';
  }

  const typeNames: Record<string, string> = {
    restroom: 'restroom',
    food: 'food option',
    water: 'water fountain',
    charging: 'charging station',
    medical: 'first aid station',
    info: 'information desk',
    lounge: 'lounge',
  };

  return {
    poi: nearest,
    distance: distanceMeters,
    directions: `The nearest ${typeNames[nearest.type]} is ${nearest.name}, about ${distanceMeters} meters ${direction}. ${nearest.description} It's approximately a ${walkingTime} minute walk.`,
  };
}

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
