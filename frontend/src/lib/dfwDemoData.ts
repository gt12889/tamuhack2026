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
// Coordinates updated to match actual DFW airport terminal locations
// DFW Airport Center: 32.8998° N, 97.0403° W (note: longitude is negative)
export const DFW_JOURNEY_WAYPOINTS: DFWWaypoint[] = [
  // Terminal A - Landside (Entrance/Check-in area)
  {
    id: 'entrance',
    name: 'Terminal A Entrance',
    lat: 32.9045,
    lng: -97.0435,
    terminal: 'A',
    instruction: 'Enter Terminal A through the automatic doors. Head to check-in.',
    landmarks: ['Curbside drop-off', 'AA Welcome sign'],
    estimatedTimeFromStart: 0,
  },
  {
    id: 'checkin',
    name: 'Terminal A Check-in Hall',
    lat: 32.9038,
    lng: -97.0430,
    terminal: 'A',
    instruction: 'Walk past the check-in counters toward Security on your right.',
    landmarks: ['AA check-in kiosks', 'Baggage drop counters'],
    estimatedTimeFromStart: 60,
  },
  // Terminal A - Security
  {
    id: 'security_approach',
    name: 'Security Checkpoint',
    lat: 32.9028,
    lng: -97.0422,
    terminal: 'A',
    instruction: 'Enter the TSA security line. Have your ID and boarding pass ready.',
    landmarks: ['TSA PreCheck lane on left', 'Security queue'],
    estimatedTimeFromStart: 120,
  },
  {
    id: 'security',
    name: 'Security Screening',
    lat: 32.9018,
    lng: -97.0415,
    terminal: 'A',
    instruction: 'Remove shoes and belt. Place items in bins.',
    landmarks: ['X-ray conveyor', 'Body scanner'],
    estimatedTimeFromStart: 300,
  },
  // Terminal A - Airside Concourse (curved corridor)
  {
    id: 'post_security',
    name: 'Terminal A Concourse Entry',
    lat: 32.9010,
    lng: -97.0408,
    terminal: 'A',
    instruction: 'You are now airside. Follow signs to Skylink or walk to Terminal B.',
    landmarks: ['Gate A10', 'Information desk'],
    estimatedTimeFromStart: 420,
  },
  {
    id: 'a_concourse_south',
    name: 'Terminal A South Concourse',
    lat: 32.9002,
    lng: -97.0402,
    terminal: 'A',
    instruction: 'Continue along the curved concourse toward Skylink station.',
    landmarks: ['Gate A22', 'Starbucks', 'Newsstand'],
    estimatedTimeFromStart: 500,
  },
  // Skylink Station A (elevated, at terminal midpoint)
  {
    id: 'skylink_a_approach',
    name: 'Skylink Station A Entrance',
    lat: 32.8995,
    lng: -97.0398,
    terminal: 'A',
    instruction: 'Take the escalator UP to the Skylink platform.',
    landmarks: ['Skylink signs', 'Escalators', 'Elevator'],
    estimatedTimeFromStart: 560,
  },
  {
    id: 'skylink_a',
    name: 'Skylink Platform - Terminal A',
    lat: 32.8992,
    lng: -97.0396,
    terminal: 'A',
    instruction: 'Board the Skylink train. Take the CLOCKWISE train toward Terminal B.',
    landmarks: ['Platform screen doors', 'Departure display'],
    estimatedTimeFromStart: 600,
  },
  // Skylink elevated track (curves around the horseshoe)
  {
    id: 'skylink_transit_1',
    name: 'Skylink - Departing Terminal A',
    lat: 32.8988,
    lng: -97.0394,
    terminal: 'Skylink',
    instruction: 'Train departing. Next stop: Terminal B.',
    landmarks: ['View of tarmac', 'Aircraft'],
    estimatedTimeFromStart: 650,
  },
  {
    id: 'skylink_transit_2',
    name: 'Skylink - Approaching Terminal B',
    lat: 32.8982,
    lng: -97.0398,
    terminal: 'Skylink',
    instruction: 'Approaching Terminal B. Prepare to exit.',
    landmarks: ['Terminal B ahead'],
    estimatedTimeFromStart: 700,
  },
  // Terminal B - Skylink Station
  {
    id: 'skylink_b',
    name: 'Skylink Platform - Terminal B',
    lat: 32.9055,
    lng: -97.0415,
    terminal: 'B',
    instruction: 'Exit the train. Take the escalator DOWN to the concourse.',
    landmarks: ['Exit signs', 'Escalators down'],
    estimatedTimeFromStart: 720,
  },
  {
    id: 'skylink_b_exit',
    name: 'Terminal B Skylink Exit',
    lat: 32.9052,
    lng: -97.0418,
    terminal: 'B',
    instruction: 'At the bottom, turn LEFT toward Gates B20-B30.',
    landmarks: ['Directory board', 'Gate direction signs'],
    estimatedTimeFromStart: 780,
  },
  // Terminal B - Concourse (walking to gate along curved corridor)
  {
    id: 'b_concourse_start',
    name: 'Terminal B Concourse',
    lat: 32.9049,
    lng: -97.0421,
    terminal: 'B',
    instruction: 'Walk along the concourse. Gate B22 is ahead, near the restaurants.',
    landmarks: ['Gate B15', 'Whataburger', 'Moving walkway'],
    estimatedTimeFromStart: 840,
  },
  {
    id: 'b_concourse_mid',
    name: 'Terminal B - Gate B20 Area',
    lat: 32.9047,
    lng: -97.0419,
    terminal: 'B',
    instruction: 'Continue past Gate B20. You can see restaurants ahead.',
    landmarks: ['Gate B20', 'Restrooms', 'Water fountain', 'Chili\'s nearby'],
    estimatedTimeFromStart: 900,
  },
  {
    id: 'b_gate_approach',
    name: 'Approaching Gate B22',
    lat: 32.9046,
    lng: -97.0417,
    terminal: 'B',
    instruction: 'Gate B22 is on your LEFT, right next to Starbucks and other restaurants.',
    landmarks: ['Gate B21', 'Starbucks', 'Seating area visible'],
    estimatedTimeFromStart: 940,
  },
  {
    id: 'gate_b22',
    name: 'Gate B22',
    lat: 32.9045,
    lng: -97.0415,
    terminal: 'B',
    instruction: 'You have arrived at Gate B22! It\'s right next to the restaurants. Find a seat and wait for boarding.',
    landmarks: ['Gate desk', 'Boarding door', 'Starbucks', 'Charging stations'],
    estimatedTimeFromStart: 960,
  },
];

export const DFW_GATE_LOCATION = {
  lat: 32.9045,
  lng: -97.0415,
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
    lat: 32.9041,
    lng: -97.0358,
    terminal: 'A',
    nearGate: 'A12',
    description: 'Restroom located just past security checkpoint on the right.',
  },
  {
    id: 'restroom-a-south',
    name: 'Restroom (A Concourse South)',
    type: 'restroom',
    lat: 32.9060,
    lng: -97.0360,
    terminal: 'A',
    nearGate: 'A25',
    description: 'Restroom near Gate A25, by Starbucks.',
  },
  // Terminal B - Restrooms
  {
    id: 'restroom-b-skylink',
    name: 'Restroom (Near Skylink)',
    type: 'restroom',
    lat: 32.9048,
    lng: -97.0452,
    terminal: 'B',
    nearGate: 'B15',
    description: 'Restroom at the bottom of Skylink escalators.',
  },
  {
    id: 'restroom-b-gate20',
    name: 'Restroom (Gate B20 Area)',
    type: 'restroom',
    lat: 32.9066,
    lng: -97.0435,
    terminal: 'B',
    nearGate: 'B20',
    description: 'Restroom between Gates B19 and B21.',
  },
  // Terminal A - Food
  {
    id: 'food-starbucks-a',
    name: 'Starbucks',
    type: 'food',
    lat: 32.9066,
    lng: -97.0365,
    terminal: 'A',
    nearGate: 'A22',
    description: 'Coffee and light snacks. Near Gate A22.',
    hours: '5:00 AM - 9:00 PM',
  },
  {
    id: 'food-mcdonalds-a',
    name: "McDonald's",
    type: 'food',
    lat: 32.9063,
    lng: -97.0366,
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
    lat: 32.9059,
    lng: -97.0447,
    terminal: 'B',
    nearGate: 'B17',
    description: 'Texas-style burgers. Near Gate B17.',
    hours: '6:00 AM - 10:00 PM',
  },
  {
    id: 'food-starbucks-b',
    name: 'Starbucks',
    type: 'food',
    lat: 32.9068,
    lng: -97.0427,
    terminal: 'B',
    nearGate: 'B22',
    description: 'Coffee and light snacks. Right next to Gate B22.',
    hours: '5:00 AM - 9:00 PM',
  },
  {
    id: 'food-chilis-b',
    name: 'Chili\'s',
    type: 'food',
    lat: 32.9069,
    lng: -97.0426,
    terminal: 'B',
    nearGate: 'B22',
    description: 'Full-service restaurant. Next to Gate B22.',
    hours: '10:00 AM - 10:00 PM',
  },
  // Water Fountains
  {
    id: 'water-a-security',
    name: 'Water Fountain',
    type: 'water',
    lat: 32.9028,
    lng: -97.0374,
    terminal: 'A',
    nearGate: 'A10',
    description: 'Water fountain and bottle refill station post-security.',
  },
  {
    id: 'water-b-gate20',
    name: 'Water Fountain',
    type: 'water',
    lat: 32.9066,
    lng: -97.0435,
    terminal: 'B',
    nearGate: 'B20',
    description: 'Water fountain near Gate B20 restrooms.',
  },
  // Charging Stations
  {
    id: 'charging-a-south',
    name: 'Charging Station',
    type: 'charging',
    lat: 32.9050,
    lng: -97.0358,
    terminal: 'A',
    nearGate: 'A26',
    description: 'Free device charging station with USB and outlets.',
  },
  {
    id: 'charging-b-gate22',
    name: 'Charging Station',
    type: 'charging',
    lat: 32.9068,
    lng: -97.0426,
    terminal: 'B',
    nearGate: 'B22',
    description: 'Charging stations at Gate B22 seating area, near restaurants.',
  },
  // Medical / First Aid
  {
    id: 'medical-a',
    name: 'First Aid Station',
    type: 'medical',
    lat: 32.9023,
    lng: -97.0387,
    terminal: 'A',
    nearGate: 'A8',
    description: 'Medical assistance and first aid. Staffed 24/7.',
  },
  // Information Desks
  {
    id: 'info-a-security',
    name: 'Information Desk',
    type: 'info',
    lat: 32.9028,
    lng: -97.0374,
    terminal: 'A',
    nearGate: 'A10',
    description: 'Airport information and assistance desk.',
  },
  {
    id: 'info-b-skylink',
    name: 'Information Desk',
    type: 'info',
    lat: 32.9048,
    lng: -97.0452,
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

// Journey conversation messages - simulates passenger talking during their journey
export interface JourneyConversation {
  waypointId: string;
  progressTrigger: number; // 0-1, when in journey to trigger
  messages: Array<{
    role: 'user' | 'agent';
    content: string;
    delayMs: number; // delay after previous message
  }>;
}

// Get journey conversations with passenger name substitution
export function getJourneyConversations(passengerName: string, gate: string): JourneyConversation[] {
  return [
    {
      waypointId: 'entrance',
      progressTrigger: 0.02,
      messages: [
        { role: 'user', content: "Okay, I'm inside the terminal now. It's so big in here!", delayMs: 0 },
        { role: 'agent', content: `You're doing great, ${passengerName}! Head toward the check-in counters - you'll see the American Airlines signs. Security is just past them.`, delayMs: 2000 },
      ],
    },
    {
      waypointId: 'checkin',
      progressTrigger: 0.08,
      messages: [
        { role: 'user', content: "I see all these kiosks. Do I need to check in here?", delayMs: 0 },
        { role: 'agent', content: `Since you already have your boarding pass on your phone, you can skip the kiosks. Head to the right toward the security checkpoint.`, delayMs: 2500 },
        { role: 'user', content: "Oh good, that saves time!", delayMs: 3000 },
      ],
    },
    {
      waypointId: 'security_approach',
      progressTrigger: 0.15,
      messages: [
        { role: 'user', content: "There's a long line at security. Should I be worried?", delayMs: 0 },
        { role: 'agent', content: `Don't worry, ${passengerName}. You have plenty of time. Have your ID and boarding pass ready - it'll go faster.`, delayMs: 2000 },
      ],
    },
    {
      waypointId: 'security',
      progressTrigger: 0.25,
      messages: [
        { role: 'user', content: "They want me to take off my shoes and put everything in bins. This is confusing!", delayMs: 0 },
        { role: 'agent', content: `You've got this! Just put your bag, jacket, and shoes in the grey bins. Keep your phone and boarding pass.`, delayMs: 2500 },
        { role: 'user', content: "Okay, I'm through! That wasn't so bad.", delayMs: 8000 },
        { role: 'agent', content: `Wonderful! Now grab your things and put your shoes back on. Take your time.`, delayMs: 2000 },
      ],
    },
    {
      waypointId: 'post_security',
      progressTrigger: 0.38,
      messages: [
        { role: 'user', content: "I'm past security. Which way do I go now?", delayMs: 0 },
        { role: 'agent', content: `Great job! Now follow the signs to the Skylink train. It's a short ride to Terminal B where your gate is.`, delayMs: 2000 },
      ],
    },
    {
      waypointId: 'a_concourse_south',
      progressTrigger: 0.45,
      messages: [
        { role: 'user', content: "Oh, I see a Starbucks! Maybe I should get a coffee?", delayMs: 0 },
        { role: 'agent', content: `You have time for a quick stop if you'd like! But there's also a Starbucks right at your gate in Terminal B.`, delayMs: 2500 },
        { role: 'user', content: "I'll wait and get it at the gate then. Keep me company!", delayMs: 3000 },
        { role: 'agent', content: `Of course! I'll be right here with you the whole way. The Skylink station is just ahead.`, delayMs: 2000 },
      ],
    },
    {
      waypointId: 'skylink_a',
      progressTrigger: 0.58,
      messages: [
        { role: 'user', content: "I'm on the platform. There are two directions - which train do I take?", delayMs: 0 },
        { role: 'agent', content: `Take the train going CLOCKWISE - that's to your right. It'll take you directly to Terminal B.`, delayMs: 2000 },
        { role: 'user', content: "Oh here it comes! The doors are opening.", delayMs: 4000 },
        { role: 'agent', content: `Step on carefully. Hold the handrail if you need to. The ride is just a couple minutes.`, delayMs: 2000 },
      ],
    },
    {
      waypointId: 'skylink_transit_1',
      progressTrigger: 0.65,
      messages: [
        { role: 'user', content: "This train is neat! I can see the planes out the window.", delayMs: 0 },
        { role: 'agent', content: `DFW has one of the best people mover systems! Enjoy the view - Terminal B is the next stop.`, delayMs: 2000 },
      ],
    },
    {
      waypointId: 'skylink_b',
      progressTrigger: 0.72,
      messages: [
        { role: 'user', content: "We're stopping at Terminal B. Time to get off!", delayMs: 0 },
        { role: 'agent', content: `Perfect! Exit the train and take the escalator down. At the bottom, turn LEFT toward Gates B20-B30.`, delayMs: 2500 },
      ],
    },
    {
      waypointId: 'b_concourse_start',
      progressTrigger: 0.84,
      messages: [
        { role: 'user', content: "I can smell the food! My tummy is rumbling a little.", delayMs: 0 },
        { role: 'agent', content: `There's a Starbucks and Chili's right at your gate! You can grab something once you arrive. Just a little further now.`, delayMs: 2500 },
      ],
    },
    {
      waypointId: 'b_concourse_mid',
      progressTrigger: 0.90,
      messages: [
        { role: 'user', content: "I see Gate B20. Am I close?", delayMs: 0 },
        { role: 'agent', content: `So close! Gate ${gate} is just two gates down on your left. You'll see the restaurants right next to it.`, delayMs: 2000 },
        { role: 'user', content: "Oh I see it! There's the Starbucks you mentioned!", delayMs: 3000 },
      ],
    },
    {
      waypointId: 'gate_b22',
      progressTrigger: 0.98,
      messages: [
        { role: 'user', content: `I made it! I'm at Gate ${gate}!`, delayMs: 0 },
        { role: 'agent', content: `Congratulations, ${passengerName}! You did wonderfully! Find a comfortable seat near the gate desk.`, delayMs: 2500 },
        { role: 'user', content: "Thank you so much for helping me! I couldn't have done it without you.", delayMs: 3500 },
        { role: 'agent', content: `It was my pleasure! Now relax, maybe grab that coffee. I'll let you know when boarding begins!`, delayMs: 2500 },
      ],
    },
  ];
}

// Get conversation for a specific progress point (returns null if no conversation should trigger)
export function getConversationForProgress(
  progress: number,
  triggeredConversations: Set<string>,
  passengerName: string,
  gate: string
): JourneyConversation | null {
  const conversations = getJourneyConversations(passengerName, gate);

  for (const conv of conversations) {
    if (progress >= conv.progressTrigger && !triggeredConversations.has(conv.waypointId)) {
      return conv;
    }
  }

  return null;
}
