# PRD: AA Voice Concierge

## Introduction

**AA Voice Concierge** is a voice-first self-service assistant designed for elderly passengers who are uncomfortable navigating aa.com or the mobile app. Instead of calling the reservation hotline, seniors can have a natural voice conversation to change their flights—like talking to a helpful family member.

**Problem:** Elderly passengers prefer calling AA's hotline over self-service, straining reservation agents. AA built an internal phone bot solution, but passengers still struggle with digital channels.

**Solution:** A web-based voice assistant that combines ElevenLabs natural speech with Gemini conversational AI, presenting a minimal large-text interface that lets seniors complete flight changes through conversation alone.

**Hackathon:** TAMUHack 2026
**Tracks:** American Airlines (Main) | Gemini | ElevenLabs | Vultr

---

## Goals

- Enable elderly passengers to **change flights via voice conversation** without navigating complex UIs
- Reduce calls to AA reservation hotline by providing a comfortable self-service alternative
- Showcase **ElevenLabs** as the core voice interface (not a bolt-on)
- Use **Gemini** for natural language understanding of travel requests
- Provide **family helper mode** so relatives can assist remotely via shared link
- Deploy on **Vultr** infrastructure
- Win the hackathon with an emotionally compelling, differentiated demo

---

## User Stories

### Phase 1: Core Voice Experience (MVP)

#### US-001: Landing page with "Talk to AA" button
**Description:** As an elderly passenger, I want a simple starting point so I'm not overwhelmed by options.

**Acceptance Criteria:**
- [ ] Single page with AA branding, large "Talk to AA" button
- [ ] Minimal text: "Need help with your flight? Just talk to me."
- [ ] Button is at least 200px wide with high contrast
- [ ] Works on desktop and tablet (mobile via separate team)
- [ ] No login required to start conversation

#### US-002: Voice input capture
**Description:** As a passenger, I want to speak my request so I don't have to type.

**Acceptance Criteria:**
- [ ] Browser microphone permission requested on first interaction
- [ ] Visual indicator when listening (pulsing mic icon)
- [ ] Speech-to-text via Web Speech API or Whisper
- [ ] Handles pauses gracefully (2-second silence = end of utterance)
- [ ] Fallback text input for accessibility

#### US-003: Gemini conversation understanding
**Description:** As the system, I need to understand natural travel requests so I can help appropriately.

**Acceptance Criteria:**
- [ ] Gemini API processes user speech transcript
- [ ] Understands intents: change flight, check status, find reservation
- [ ] Extracts entities: dates, destinations, confirmation codes
- [ ] Asks clarifying questions conversationally when needed
- [ ] Maintains conversation context across turns
- [ ] Prompt engineered for elderly-friendly, patient responses

#### US-004: ElevenLabs voice responses
**Description:** As an elderly passenger, I want the assistant to speak responses so I can listen instead of read.

**Acceptance Criteria:**
- [ ] ElevenLabs API generates speech for all assistant responses
- [ ] Uses warm, clear, professional voice (pre-made "Rachel" or similar)
- [ ] Audio plays automatically after each response
- [ ] Speaking rate slightly slower than default (0.9x)
- [ ] Visual text also displayed for hearing-impaired users

#### US-005: Reservation lookup by voice
**Description:** As a passenger, I want to find my reservation by speaking my confirmation code or name.

**Acceptance Criteria:**
- [ ] Voice prompt: "What's your confirmation code? You can spell it out."
- [ ] Handles spelled letters: "A as in Apple, B as in Boy..."
- [ ] Alternative: "I don't have it. My name is John Smith, flying to Dallas."
- [ ] Mock reservation data returned for demo
- [ ] Displays found reservation in large, simple format

#### US-006: Flight change conversation flow
**Description:** As a passenger, I want to change my flight by describing what I need.

**Acceptance Criteria:**
- [ ] Understands natural requests: "I need to fly tomorrow instead"
- [ ] Gemini identifies: original flight, desired change, constraints
- [ ] Presents 1-2 options verbally: "I found a flight tomorrow at 2pm. It arrives at 5pm. Would you like this one?"
- [ ] Shows options visually with giant text and big buttons
- [ ] Confirms selection verbally before finalizing

#### US-007: Simple visual confirmation
**Description:** As a passenger, I want to see and hear confirmation so I know it worked.

**Acceptance Criteria:**
- [ ] Large confirmation display: new flight details, confirmation code
- [ ] Voice reads: "You're all set! Your new flight is [details]. I'm sending this to your email."
- [ ] Big green checkmark visual
- [ ] "Start Over" button if they need more help
- [ ] Mock email/text confirmation sent

---

### Phase 2: Family Helper Mode

#### US-008: Generate shareable help link
**Description:** As an elderly passenger, I want to share a link with my family so they can help me.

**Acceptance Criteria:**
- [ ] "I need help from my family" voice command or button
- [ ] Generates unique session link (e.g., `/help/abc123`)
- [ ] Voice: "I'll create a link you can send to your family. They'll see exactly what we're working on."
- [ ] Link copied to clipboard + displayed in large text
- [ ] Link valid for 30 minutes

#### US-009: Family helper view
**Description:** As a family member, I want to see my relative's session so I can guide them.

**Acceptance Criteria:**
- [ ] Helper link opens read-only view of conversation
- [ ] Shows current reservation and proposed changes
- [ ] Helper can type suggestions (appears as "Family says: ...")
- [ ] Voice reads family suggestions to the senior
- [ ] Helper cannot directly make changes (senior must confirm)

---

### Phase 3: Polish (Stretch)

#### US-010: Conversation transcript
**Description:** As a passenger, I want to see what was said so I can review it.

**Acceptance Criteria:**
- [ ] Expandable transcript panel (collapsed by default)
- [ ] Shows user speech and assistant responses
- [ ] Auto-scrolls to latest message
- [ ] Large readable text

#### US-011: Multiple language support
**Description:** As a Spanish-speaking passenger, I want to use the assistant in my language.

**Acceptance Criteria:**
- [ ] Language selector: English, Spanish
- [ ] Gemini prompts adjusted for Spanish
- [ ] ElevenLabs Spanish voice for responses
- [ ] UI text translated

---

## Functional Requirements

### Voice Layer
- FR-1: Web Speech API for speech-to-text (or Whisper API fallback)
- FR-2: ElevenLabs API for text-to-speech responses
- FR-3: Auto-play audio responses with visual text fallback
- FR-4: Microphone permission handling with clear user prompts
- FR-5: Voice activity detection with 2-second silence threshold

### AI Layer
- FR-6: Gemini API for conversational understanding
- FR-7: Intent classification: change_flight, check_status, lookup_reservation, need_help
- FR-8: Entity extraction: dates, cities, confirmation codes, passenger names
- FR-9: Context maintenance across conversation turns
- FR-10: Elderly-friendly prompt engineering (patient, clear, no jargon)

### Frontend Layer
- FR-11: Next.js app with minimal, large-text UI
- FR-12: High contrast colors, minimum 24px font size
- FR-13: Buttons minimum 60px touch target
- FR-14: Single primary action visible at any time
- FR-15: Visual listening/speaking state indicators
- FR-16: Family helper link generation and sharing

### Backend Layer
- FR-17: Django API for reservation data and session management
- FR-18: Mock AA reservation data (flights, passengers, bookings)
- FR-19: Session storage for conversation context
- FR-20: Helper link generation and real-time sync

### Infrastructure
- FR-21: Django backend deployed on Vultr
- FR-22: PostgreSQL for session and reservation data
- FR-23: WebSocket or polling for family helper sync
- FR-24: Next.js frontend on Vultr or Vercel

---

## Non-Goals (Out of Scope)

- Native mobile app (separate team handles this)
- Actual AA booking system integration
- Payment processing
- Multi-passenger bookings
- Complex itineraries (focus on single flight changes)
- Accessibility features beyond large text and voice (screen readers, etc.)
- Languages beyond English and Spanish

---

## Technical Considerations

### Voice Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Web Speech  │  │   Audio     │  │   Minimal UI        │ │
│  │ API (STT)   │  │   Player    │  │   (Large Text)      │ │
│  └──────┬──────┘  └──────▲──────┘  └─────────────────────┘ │
│         │                │                                  │
└─────────┼────────────────┼──────────────────────────────────┘
          │                │
          ▼                │
┌─────────────────────────────────────────────────────────────┐
│                     Django Backend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Gemini    │  │ ElevenLabs  │  │   Mock AA Data      │ │
│  │   (NLU)     │  │   (TTS)     │  │   (Reservations)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Gemini Prompt Strategy
```
You are a friendly American Airlines assistant helping elderly passengers
change their flights. Be patient, speak clearly, and avoid jargon.

Guidelines:
- Use simple words and short sentences
- Confirm understanding before proceeding
- Offer only 1-2 options at a time
- Read back important details
- If confused, ask for clarification kindly

Current reservation: {reservation_details}
Conversation so far: {history}
User just said: {user_input}

Respond conversationally. If you need information, ask one question at a time.
```

### ElevenLabs Configuration
- Voice: Pre-made professional (e.g., "Rachel" or "Josh")
- Stability: 0.7 (consistent but natural)
- Similarity boost: 0.8
- Speaking rate: 0.9x (slightly slower for clarity)

### Mock Data
- 10 mock reservations with varied scenarios
- Demo confirmation code: `DEMO123`
- Flights between major AA hubs: DFW, ORD, MIA, LAX, JFK

---

## Demo Scenario

**"Grandma Changes Her Flight"**

1. Elderly passenger opens simple landing page
2. Clicks big "Talk to AA" button
3. **Voice:** "Hi! I'm your American Airlines assistant. I'm here to help with your trip. What do you need today?"
4. **Passenger speaks:** "I need to change my flight"
5. **Voice:** "I'd be happy to help you change your flight. What's your confirmation code? You can spell it out letter by letter."
6. **Passenger:** "D-E-M-O-1-2-3"
7. **Voice:** "Got it! I found your reservation. You're flying from Dallas to Chicago on January 25th. What would you like to change?"
8. **Passenger:** "I need to go on the 26th instead"
9. **Voice:** "Let me look for flights on January 26th... I found one leaving at 2pm and arriving at 5pm. Would you like me to book this for you?"
10. **[Big visual shows the option with giant "Yes, book it" button]**
11. **Passenger clicks or says:** "Yes"
12. **Voice:** "Perfect! You're all set. Your new flight is January 26th at 2pm. I'm sending the details to your email. Is there anything else I can help with?"
13. **[Big green checkmark, confirmation displayed]**

**Family Helper Demo (if time):**
14. Passenger says: "Can my daughter help me?"
15. Voice generates link, passenger texts it to daughter
16. Daughter sees the session, types: "Mom, the 2pm flight looks good!"
17. Voice reads: "Your daughter says: the 2pm flight looks good!"

---

## Success Metrics (Demo)

- Complete flight change via voice in under 2 minutes
- Zero typing required for core flow
- Voice responses generate in <2 seconds
- UI readable from 3 feet away (large text validation)
- Family helper link works in real-time
- Judges can try it themselves with demo confirmation code

---

## Decisions Made

| Question | Decision |
|----------|----------|
| **Primary focus** | Voice-first elderly accessibility |
| **Voice interaction** | Full two-way voice conversation |
| **UI style** | Minimal, large text, high contrast |
| **Family helper** | Yes - shareable session link |
| **Core task** | Flight rebooking/changes |
| **Languages** | English + Spanish (stretch) |
| **ElevenLabs voice** | Pre-made professional voice |
| **Data** | Mock AA reservation data |

---

## Implementation Order

### Phase 1: Voice Foundation (Must Have)
1. US-001: Landing page with Talk button
2. US-002: Voice input capture (Web Speech API)
3. US-004: ElevenLabs voice output
4. Basic conversation loop working

### Phase 2: AI + Booking Flow (Must Have)
5. US-003: Gemini conversation understanding
6. US-005: Reservation lookup
7. US-006: Flight change flow
8. US-007: Confirmation display

### Phase 3: Family Helper (Should Have)
9. US-008: Generate shareable link
10. US-009: Family helper view

### Phase 4: Polish (Nice to Have)
11. US-010: Conversation transcript
12. US-011: Spanish language support

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TailwindCSS |
| Voice Input | Web Speech API (browser native) |
| Voice Output | ElevenLabs TTS API |
| AI/NLU | Google Gemini API |
| Backend | Python Django, Django REST Framework |
| Database | PostgreSQL (Vultr managed) |
| Hosting | Vultr (backend), Vultr/Vercel (frontend) |
| Real-time | WebSocket for family helper sync |

---

## Why This Wins

1. **Solves a REAL AA pain point** - Mentor confirmed elderly hotline calls are a problem
2. **ElevenLabs is CORE, not a feature** - Voice is the entire UX
3. **Gemini powers natural conversation** - Not just commands, real dialogue
4. **Emotionally compelling demo** - Helping grandma is memorable
5. **Differentiated** - No other team will do voice-first
6. **Family helper is unique** - Adds heartwarming element
7. **Actually achievable** - Scoped for hackathon timeline

---

## Stretch Feature: Proactive Incoming Call

### US-012: Simulated AA Proactive Call
**Description:** As a demo feature, show AA proactively reaching out to passengers before they call the hotline.

**Acceptance Criteria:**
- [ ] Demo mode: "Incoming call from American Airlines" notification appears
- [ ] Animated phone ring visual + ElevenLabs ring tone
- [ ] User clicks "Answer" to start conversation
- [ ] Voice: "Hi, this is American Airlines. We noticed your gate changed to B12. Would you like help understanding the change?"
- [ ] Seamlessly transitions into normal voice assistant flow
- [ ] Shows proactive value: "We called YOU before you had to call us"

**Demo Script:**
1. Show passenger dashboard with upcoming flight
2. Trigger simulated gate change event
3. "Incoming call" notification pops up
4. Passenger answers
5. Voice explains the change, offers to help with anything else
6. Demonstrates proactive service reducing hotline calls

---

## API Specifications

### Backend Endpoints (Django REST Framework)

#### Conversation API
```
POST /api/conversation/start
  Request: { session_id?: string }
  Response: { session_id: string, greeting: string, audio_url: string }

POST /api/conversation/message
  Request: { session_id: string, transcript: string }
  Response: {
    reply: string,
    audio_url: string,
    intent: string,
    entities: object,
    suggested_actions: Action[]
  }

GET /api/conversation/{session_id}
  Response: { messages: Message[], reservation: Reservation?, state: string }
```

#### Reservation API
```
GET /api/reservation/lookup
  Query: { confirmation_code?: string, last_name?: string, email?: string }
  Response: { reservation: Reservation } | { error: string }

POST /api/reservation/change
  Request: {
    session_id: string,
    reservation_id: string,
    new_flight_id: string
  }
  Response: {
    success: boolean,
    new_reservation: Reservation,
    confirmation_message: string
  }

GET /api/flights/alternatives
  Query: {
    origin: string,
    destination: string,
    date: string,
    original_flight_id: string
  }
  Response: { flights: Flight[] }
```

#### Voice API
```
POST /api/voice/synthesize
  Request: { text: string, language: "en" | "es" }
  Response: { audio_url: string, duration_ms: number }
```

#### Family Helper API
```
POST /api/helper/create-link
  Request: { session_id: string }
  Response: { helper_link: string, expires_at: timestamp }

GET /api/helper/{link_id}
  Response: { session: Session, reservation: Reservation, messages: Message[] }

POST /api/helper/{link_id}/suggest
  Request: { message: string }
  Response: { success: boolean }

WebSocket /ws/helper/{link_id}
  Events: message_added, suggestion_received, session_updated
```

---

## Data Models

### Reservation
```typescript
interface Reservation {
  id: string;
  confirmation_code: string;  // e.g., "DEMO123"
  passenger: Passenger;
  flights: FlightSegment[];
  status: "confirmed" | "changed" | "cancelled";
  created_at: timestamp;
}
```

### Passenger
```typescript
interface Passenger {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  aadvantage_number?: string;
  preferences: {
    language: "en" | "es";
    seat_preference?: "window" | "aisle" | "middle";
  };
}
```

### FlightSegment
```typescript
interface FlightSegment {
  id: string;
  flight_number: string;      // e.g., "AA1234"
  origin: AirportCode;        // e.g., "DFW"
  destination: AirportCode;   // e.g., "ORD"
  departure_time: timestamp;
  arrival_time: timestamp;
  gate?: string;
  status: "scheduled" | "delayed" | "cancelled" | "boarding" | "departed";
  seat?: string;
}
```

### Session
```typescript
interface Session {
  id: string;
  state: "greeting" | "lookup" | "viewing" | "changing" | "confirming" | "complete";
  reservation_id?: string;
  messages: Message[];
  helper_link?: string;
  created_at: timestamp;
  expires_at: timestamp;
}
```

### Message
```typescript
interface Message {
  id: string;
  role: "user" | "assistant" | "family";
  content: string;
  audio_url?: string;
  timestamp: timestamp;
  intent?: string;
  entities?: Record<string, any>;
}
```

### Mock Data for Demo
```typescript
const DEMO_RESERVATIONS = [
  {
    confirmation_code: "DEMO123",
    passenger: { first_name: "Margaret", last_name: "Johnson", email: "margaret@example.com" },
    flights: [
      { flight_number: "AA1234", origin: "DFW", destination: "ORD", departure: "2026-01-25T14:00:00", gate: "A12" }
    ]
  },
  {
    confirmation_code: "TEST456",
    passenger: { first_name: "Robert", last_name: "Smith", email: "robert@example.com" },
    flights: [
      { flight_number: "AA567", origin: "LAX", destination: "JFK", departure: "2026-01-26T09:00:00", gate: "B7" },
      { flight_number: "AA890", origin: "JFK", destination: "MIA", departure: "2026-01-26T16:00:00", gate: "C3" }
    ]
  },
  // ... 8 more mock reservations
];

const ALTERNATIVE_FLIGHTS = [
  { flight_number: "AA1235", departure: "2026-01-26T08:00:00", arrival: "2026-01-26T11:00:00" },
  { flight_number: "AA1237", departure: "2026-01-26T14:00:00", arrival: "2026-01-26T17:00:00" },
  { flight_number: "AA1239", departure: "2026-01-26T19:00:00", arrival: "2026-01-26T22:00:00" },
];
```

---

## Error Handling

### Voice Recognition Errors
| Error | User Experience | Technical Handling |
|-------|-----------------|-------------------|
| Microphone denied | "I need access to your microphone to hear you. Please click Allow." | Show permission prompt, fallback to text input |
| No speech detected | "I didn't catch that. Could you please repeat?" | Retry with 5-second timeout |
| Unclear audio | "I'm having trouble hearing you. Let me try again." | Retry up to 3 times, then offer text fallback |
| Browser not supported | "Your browser doesn't support voice. Please type instead." | Detect on load, show text-only mode |

### API Errors
| Error | User Experience | Technical Handling |
|-------|-----------------|-------------------|
| Gemini timeout | "Give me just a moment..." + retry | 10-second timeout, retry once |
| ElevenLabs failure | Show text response only | Log error, graceful degradation |
| Reservation not found | "I couldn't find that reservation. Let me try another way." | Offer alternative lookup methods |
| Network error | "I'm having connection issues. Let me try again." | Exponential backoff, 3 retries |

### Graceful Degradation
1. **Voice fails → Text fallback**: Always show typed input option
2. **ElevenLabs fails → Browser TTS**: Use Web Speech API synthesis as backup
3. **Gemini fails → Scripted responses**: Pre-written responses for common intents
4. **WebSocket fails → Polling**: Fall back to 2-second polling for family helper

---

## Accessibility Considerations

### Visual Accessibility
- **Font sizes**: Minimum 24px body, 32px headings, 48px buttons
- **Color contrast**: WCAG AAA (7:1 ratio minimum)
- **Color-blind safe**: Don't rely on color alone; use icons + labels
- **Focus indicators**: Large, visible focus rings (4px solid)

### Hearing Accessibility
- **Visual transcript**: All voice responses shown as text
- **Captions**: Real-time display of what assistant says
- **Visual feedback**: Animations for listening/speaking states

### Motor Accessibility
- **Large touch targets**: 60px minimum (exceeds WCAG 44px)
- **Voice-only operation**: Can complete entire flow without clicking
- **Keyboard navigation**: Full tab navigation support
- **No time pressure**: No auto-advancing screens

### Cognitive Accessibility
- **Simple language**: 6th grade reading level
- **One action at a time**: Never multiple choices on screen
- **Consistent layout**: Same UI structure throughout
- **Clear feedback**: Explicit confirmation of every action

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Web Speech API browser inconsistency | Voice input fails on some browsers | Medium | Test on Chrome/Edge/Safari; show supported browsers |
| ElevenLabs rate limits | Voice responses delayed/fail | Low | Cache common phrases; have text fallback |
| Gemini response latency | Slow conversation flow | Medium | Show "thinking" animation; optimize prompts |
| Demo confirmation code shared publicly | Everyone uses same data | High | Reset mock data between demos; have backup codes |
| Microphone permissions scary for elderly | Users decline mic access | Medium | Clear explanation + text fallback option |
| Background noise in demo environment | Voice recognition fails | High | Have text input ready; practice in quiet area |

---

## Hackathon Track Alignment

### American Airlines Track (Main)
| Criteria | How We Address It |
|----------|-------------------|
| Improve passenger experience | Voice-first accessibility for underserved elderly demographic |
| Reduce operational burden | Fewer hotline calls = reduced reservation agent load |
| Innovative solution | Voice-first approach is unique among digital channels |
| Feasibility | Scoped to single flow (flight changes) with mock data |

### Gemini Track
| Criteria | How We Address It |
|----------|-------------------|
| Creative use of Gemini | Natural language conversation, not just Q&A |
| Demonstrates AI value | Understands "I need to fly tomorrow" → finds flights |
| Multi-turn dialogue | Maintains context across conversation |
| Prompt engineering | Elderly-optimized prompts (patient, simple, clear) |

### ElevenLabs Track
| Criteria | How We Address It |
|----------|-------------------|
| Voice is central to UX | Entire app is voice-first, not a bolt-on |
| Natural speech quality | Uses professional pre-made voices |
| Creative application | Accessible technology for elderly users |
| Multiple languages | English + Spanish support |

### Vultr Track
| Criteria | How We Address It |
|----------|-------------------|
| Deployed on Vultr | Django backend + PostgreSQL on Vultr |
| Uses Vultr services | Compute + managed database |
| Scalable architecture | Stateless API design, session storage in DB |
| Real-world deployment | Publicly accessible demo URL |

---

## Presentation Outline (5 minutes)

### 1. Hook (30 sec)
"Your grandmother needs to change her flight. Would she rather navigate aa.com... or just say 'I need to fly tomorrow'?"

### 2. Problem (45 sec)
- Show AA mentor quote about elderly hotline calls
- Stats: X% of AA calls from passengers 65+
- Current solution requires digital literacy

### 3. Solution (1 min)
- Introduce AA Voice Concierge
- Voice-first, minimal UI, no navigation required
- "Like talking to a helpful family member"

### 4. Live Demo (2 min)
- Open landing page
- Click "Talk to AA"
- Complete flight change via voice
- Show confirmation
- (If time) Demo family helper link

### 5. Tech Stack (30 sec)
- ElevenLabs: Natural voice responses
- Gemini: Understands natural requests
- Vultr: Reliable hosting
- Next.js + Django: Modern stack

### 6. Impact (15 sec)
- Reduces hotline calls
- Serves underserved demographic
- Differentiated from all other digital channels

---

## Post-Hackathon Potential

If AA wanted to productionize this:

1. **Integration with AA systems**: Real booking data, actual rebooking
2. **Phone channel**: Integrate with existing AA phone system as IVR alternative
3. **Proactive outreach**: Call passengers before they call AA
4. **Expanded tasks**: Check-in, seat selection, upgrades, baggage
5. **Personalization**: Remember passenger preferences, past interactions
6. **Analytics**: Track which flows reduce hotline calls most

---

## Appendix: Sample Gemini Prompts

### System Prompt
```
You are a friendly American Airlines voice assistant helping elderly passengers manage their flights. Your name is "AA Assistant."

PERSONALITY:
- Patient and understanding - never rush
- Warm and friendly - like a helpful grandchild
- Clear and simple - avoid jargon, use short sentences
- Reassuring - confirm understanding frequently

RULES:
1. Ask ONE question at a time
2. Always confirm before making changes
3. Read back important details (dates, times, flight numbers)
4. If unsure, ask for clarification politely
5. Keep responses under 3 sentences when possible
6. Use 12-hour time format with AM/PM
7. Spell out months (January, not 1/25)

CURRENT STATE:
- Session ID: {session_id}
- Reservation: {reservation_json}
- Conversation history: {messages}
- Current intent: {detected_intent}

USER JUST SAID: "{user_transcript}"

Respond naturally. If you need information, ask. If you can help, do so clearly.
```

### Intent Classification Prompt
```
Classify the user's intent from their statement. Return JSON only.

Possible intents:
- lookup_reservation: User wants to find their booking
- change_flight: User wants to modify their flight date/time
- check_status: User wants flight status information
- need_help: User is confused or needs assistance
- confirm_action: User is confirming a proposed change
- cancel_action: User wants to go back or cancel
- family_help: User wants to involve family member
- other: Doesn't fit above categories

User said: "{transcript}"
Context: {conversation_summary}

Return: { "intent": "...", "confidence": 0.0-1.0, "entities": {...} }
```

### Entity Extraction Prompt
```
Extract travel entities from the user's statement. Return JSON only.

Entities to find:
- confirmation_code: 6-character alphanumeric (e.g., ABC123)
- date: Any date reference (tomorrow, January 26th, next week)
- time: Time preference (morning, 2pm, evening)
- city: City name (Dallas, Chicago)
- airport: Airport code (DFW, ORD)
- flight_number: AA followed by numbers (AA1234)
- passenger_name: First and/or last name

User said: "{transcript}"

Return: { "entities": { "date": "...", "city": "...", ... }, "raw_values": {...} }
```

---

## Checklist: PRD Complete

- [x] Introduction with problem/solution
- [x] Goals aligned with hackathon tracks
- [x] User stories with acceptance criteria (12 total)
- [x] Functional requirements (24 total)
- [x] Non-goals / out of scope defined
- [x] Technical architecture diagram
- [x] API specifications
- [x] Data models
- [x] Error handling strategy
- [x] Accessibility considerations
- [x] Demo scenario with script
- [x] Success metrics
- [x] Implementation order / phases
- [x] Tech stack summary
- [x] Risk & mitigations
- [x] Track alignment (all 4 tracks)
- [x] Presentation outline
- [x] Sample Gemini prompts
- [x] Stretch feature (proactive call)
