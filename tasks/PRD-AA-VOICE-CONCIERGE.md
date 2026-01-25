# Product Requirements Document: AA Voice Concierge

**Version:** 1.0
**Last Updated:** January 24, 2026
**Project:** TAMUHack 2026 - American Airlines Track

---

## Executive Summary

AA Voice Concierge is a voice-first flight assistance application designed for elderly American Airlines passengers. It enables natural voice conversations to manage flight reservations, reducing calls to AA's reservation hotline while providing an accessible, senior-friendly interface.

---

## Problem Statement

Elderly passengers often struggle with:
- Complex mobile apps and websites
- Long hold times on phone support
- Navigating automated phone menus
- Understanding flight change options
- Getting help from family members remotely

**Solution:** A voice-first assistant that speaks naturally, understands context, and connects family members for real-time assistance.

---

## Target Users

| User Type | Description | Needs |
|-----------|-------------|-------|
| Primary | Elderly passengers (65+) | Simple voice interaction, large text, patient responses |
| Secondary | Family helpers | Remote viewing, send suggestions, monitor progress |
| Tertiary | AA customer service | Reduced call volume, improved satisfaction |

---

## Core Features

### 1. Voice-First Conversation Engine

**Description:** Natural language voice interface powered by Google Gemini AI and ElevenLabs TTS.

**Capabilities:**
- Speech-to-text via Web Speech API
- Natural language understanding with intent/entity extraction
- Text-to-speech with human-like voices
- Bilingual support (English/Spanish) with auto-detection
- Fallback to browser TTS when cloud unavailable

**Supported Intents:**
| Intent | Description | Example |
|--------|-------------|---------|
| `greeting` | Session start | "Hello, I need help" |
| `lookup_reservation` | Find booking | "I have a reservation" |
| `change_flight` | Reschedule | "I need to change my flight" |
| `new_booking` | Book flight | "I want to book a flight" |
| `check_status` | Flight info | "Is my flight on time?" |
| `confirm` | Approve action | "Yes, that's correct" |
| `cancel` | Decline action | "No, go back" |
| `family_help` | Request assistance | "Can my daughter help?" |

**Voice Settings:**
- Speed: 0.9x (slower for clarity)
- Stability: 0.7
- Similarity: 0.8

---

### 2. Reservation Management

**Lookup Methods:**
- Confirmation code (voice: "D-E-M-O-1-2-3" or "DEMO123")
- Phonetic alphabet support ("Delta Echo Mike Oscar...")
- Name + email combination

**Flight Change Workflow:**
1. User provides confirmation code
2. System retrieves reservation details
3. User specifies desired change ("tomorrow", "next Saturday")
4. System presents 3 alternative flights
5. User selects preferred option
6. System confirms change (same confirmation code)
7. Voice summary of changes

**New Booking Workflow:**
1. Collect origin city/airport
2. Collect destination city/airport
3. Collect travel date
4. Ask round-trip preference
5. Ask number of travelers
6. Present flight options
7. Collect passenger name
8. Generate confirmation code
9. Voice summary of booking

---

### 3. Family Helper Mode

**Purpose:** Allow remote family members to view conversations, send suggestions, AND perform actions on behalf of the passenger.

**Features:**
- Generate unique shareable link (8-character URL-safe token)
- Real-time conversation view (3-second polling)
- Passenger information dashboard
- Flight status cards with countdown timers
- Send text suggestions (read aloud to passenger)
- **Full action capabilities** (see below)
- Session expiry (configurable, default 30 minutes)
- Link modes: `full` (all actions) or `view_only` (read + suggest only)

**Caregiver Actions:**
| Action | Endpoint | Description |
|--------|----------|-------------|
| Change Flight | `/actions/change-flight` | Rebook passenger to alternative flight |
| Cancel Flight | `/actions/cancel-flight` | Cancel the reservation |
| Select Seat | `/actions/select-seat` | Choose preferred seat |
| Add Bags | `/actions/add-bags` | Add checked baggage |
| Request Wheelchair | `/actions/request-wheelchair` | Request wheelchair assistance |
| Accept Rebooking | `/actions/accept-rebooking` | Accept IROP rebooking |
| Acknowledge Disruption | `/actions/acknowledge-disruption` | Acknowledge disruption notification |

**Dashboard Components:**
- PassengerInfoCard: Name, email, phone, AAdvantage#, preferences
- FlightStatusCard: Flight#, route, times, gate, seat, status badge, countdown
- **IROP Alert Banner**: Shows disruption status and actions
- Conversation transcript with role indicators
- Suggestion input form
- **Action buttons panel**: Quick access to all caregiver actions
- **Location map**: Real-time passenger location with gate distance

**Security:**
- Links expire with session
- No authentication required (token-based access)
- Action permissions controlled by link mode

---

### 4. Real-Time Voice Calls (ElevenLabs Conversational AI)

**Phone Number:** +1 (877) 211-0332

**Capabilities:**
- Web-based voice calls via signed URL
- Phone calls via ElevenLabs platform
- Real-time transcription
- Server tool calling for backend operations
- Natural voice with configurable speed/stability

**Available Server Tools (11 total):**
| Tool | Description |
|------|-------------|
| `lookup_reservation` | Find reservation by confirmation code |
| `change_flight` | Reschedule to new date |
| `create_booking` | Book new flight |
| `get_flight_options` | Search available flights |
| `get_reservation_status` | Check booking status |
| `create_family_helper_link` | Generate helper link for caregiver |
| `check_flight_delays` | Check for delays and disruptions |
| `get_gate_directions` | Get directions to departure gate |
| `request_wheelchair` | Request wheelchair assistance |
| `add_bags` | Add checked baggage |
| `get_irop_rebooking_options` | Get IROP rebooking options |

**Server Tool Response Format:**
All tools return a `spoken_summary` field that the agent reads aloud to the user.

---

### 5. IROP (Irregular Operations) Handling

**Purpose:** Automatically detect and handle flight disruptions with proactive rebooking options.

**Disruption Types:**
| Type | Detection | Response |
|------|-----------|----------|
| Delay | Flight departure time changed | Show new time, offer rebooking if significant |
| Cancellation | Flight status = cancelled | Present rebooking options immediately |
| Missed Connection | Insufficient connection time | Analyze risk, offer alternative routes |

**IROP Scenarios (Mock Data):**
| Scenario | Trigger | Rebooking Options |
|----------|---------|-------------------|
| Delay | Original flight delayed 2+ hours | 3 alternative flights |
| Cancellation | Flight cancelled | Next available flights |
| Missed Connection | < 30min connection time | Alternative routing |

**Caregiver IROP Actions:**
- View disruption details and severity
- See rebooking options with times/prices
- Accept or decline airline-proposed rebooking
- Acknowledge disruption notification

**API Endpoints:**
- `GET /helper/{link_id}/irop-status` - Get current disruption status
- `POST /helper/{link_id}/actions/accept-rebooking` - Accept rebooking
- `POST /helper/{link_id}/actions/acknowledge-disruption` - Acknowledge

---

### 6. Location Tracking

**Purpose:** Track elderly passenger's real-time location to ensure they reach their gate on time.

**Features:**
- GPS coordinates with accuracy radius
- Distance to departure gate (feet/meters)
- Walking time estimates
- Automatic alerts when at risk of missing flight

**Alert Statuses:**
| Status | Color | Condition |
|--------|-------|-----------|
| `safe` | Green | > 30 min to departure or close to gate |
| `warning` | Yellow | 15-30 min and far from gate |
| `urgent` | Red | < 15 min and far from gate |
| `arrived` | Blue | At or near departure gate |

**Data Model:**
```
LocationUpdate:
  - session_id (FK to Session)
  - latitude, longitude
  - accuracy (meters)
  - timestamp
  - gate_distance_feet
  - estimated_walk_time_minutes
  - alert_status

LocationAlert:
  - session_id (FK to Session)
  - alert_type (far_from_gate, low_time, etc.)
  - severity (warning, urgent)
  - message
  - acknowledged (boolean)
```

**API Endpoints:**
- `POST /location/update` - Update passenger location
- `POST /location/alert` - Trigger alert
- `GET /location/{session_id}/history` - Get location history
- `GET /helper/{link_id}/location` - Get location for caregiver view

---

### 7. Flight Information

**Data Sources:**
- Mock database with demo reservations
- AA Flight-Engine integration (optional)
- Dynamic flight generation for testing

**Flight Statuses:**
| Status | Color | Description |
|--------|-------|-------------|
| Scheduled | Green | On-time departure |
| Delayed | Yellow | Departure delayed |
| Cancelled | Red | Flight cancelled |
| Boarding | Blue | Now boarding |
| Departed | Gray | Already departed |

**Demo Reservations (Voice-Friendly Codes):**
| Code | Passenger | Route | Language | Scenario |
|------|-----------|-------|----------|----------|
| MEEMAW | Margaret Johnson | DFW → ORD | English | Standard |
| GRANNY | Maria Garcia | MIA → SJU | Spanish | IROP delay |
| PAPA44 | Robert Smith | LAX → JFK → MIA | English | Multi-segment |
| NANA55 | Eleanor Williams | ORD → PHX | English | Family |

---

## Technical Architecture

### Backend (Django + DRF)

**Models:**
```
Passenger (id, name, email, phone, preferences)
    ↓
Reservation (id, confirmation_code, status)
    ↓
FlightSegment (seat, order) → Flight (number, route, times, status)
    ↓
Session (state, helper_link, context, expiry)
    ↓
Message (role, content, audio_url, intent, entities)
```

**Services:**
| Service | Purpose | Provider |
|---------|---------|----------|
| GeminiService | NLU + Response generation | Google Gemini 1.5 Flash |
| ElevenLabsService | TTS + Conversational AI | ElevenLabs |
| ElevenLabsWebhookHandler | Server tool processing | Backend |
| FlightEngineService | Flight data | AA Flight-Engine |
| LocationService | GPS tracking + alerts | Backend |

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversation/start` | Initialize session |
| POST | `/api/conversation/message` | Process user input |
| GET | `/api/reservation/lookup` | Find reservation |
| POST | `/api/reservation/change` | Update flight |
| POST | `/api/helper/create-link` | Generate helper link |
| GET | `/api/helper/{link_id}` | Get helper session |
| POST | `/api/helper/{link_id}/suggest` | Send suggestion |
| POST | `/api/retell/webhook` | Handle Retell events |

### Frontend (Next.js 14 + React)

**Pages:**
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page + Demo mode |
| `/help/[linkId]` | HelperPage | Family helper dashboard |

**Key Components:**
- LandingPage: Marketing + entry point
- LiveDemo: Split-screen demo for judges
- VoiceButton: Microphone with visual feedback
- FlightCard: Flight information display
- HelperDashboard: Family member view
- PassengerInfoCard: Passenger details
- FlightStatusCard: Flight status + countdown

**Hooks:**
| Hook | Purpose |
|------|---------|
| useSpeechRecognition | Browser speech-to-text |
| useRetell | Retell AI SDK integration |
| useAudioPlayer | Audio playback control |
| useBrowserTTS | Fallback text-to-speech |

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Font Size | Minimum 24px throughout |
| Touch Targets | 60px minimum for buttons |
| Color Contrast | WCAG AA compliant |
| Language | Simple, direct, one question at a time |
| Confirmation | Always confirm before changes |
| Time Format | 12-hour with AM/PM |
| Date Format | Full month names ("January 26") |

---

## Bilingual Support

**English (Default):**
- Clear, simple instructions
- Patient, reassuring tone
- Avoid jargon and abbreviations

**Spanish:**
- Formal "usted" form
- Respectful, warm tone
- Auto-detected from user speech
- Separate ElevenLabs voice ID

**Language Persistence:**
- Stored in session context
- Maintained throughout conversation
- Can switch mid-conversation

---

## Environment Configuration

### Backend (.env)
```
GEMINI_API_KEY=<Google Gemini API key>
ELEVENLABS_API_KEY=<ElevenLabs API key>
ELEVENLABS_VOICE_ID=<English voice ID>
ELEVENLABS_VOICE_ID_ES=<Spanish voice ID>
RETELL_API_KEY=<Retell API key>
DJANGO_SECRET_KEY=<Django secret>
DEBUG=False
ALLOWED_HOSTS=<domain>
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_RETELL_AGENT_ID=<Retell agent ID>
```

---

## Session State Machine

```
greeting → lookup → viewing → changing → confirming → complete
    ↓                  ↓
    └──────────────────┴──→ (restart on timeout/error)
```

**Session Properties:**
- 30-minute expiry
- JSON context for metadata
- Unique helper_link token
- Message history preserved

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| API Keys | Backend-only, never exposed to frontend |
| Webhooks | HMAC signature verification |
| Sessions | 30-minute expiry, database cleanup |
| Helper Links | URL-safe tokens, session-bound |
| Microphone | Browser permission required |
| CORS | Configured for frontend domain only |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Speech Recognition | < 500ms latency |
| Gemini Response | < 2 seconds |
| TTS Generation | < 1.5 seconds |
| Page Load | < 3 seconds |
| Polling Interval | 3 seconds (helper view) |

---

## Testing

**Demo Flow 1: Flight Change (2 min)**
1. Click "Talk to AA"
2. Say: "I need to change my flight"
3. Spell: "D-E-M-O-1-2-3"
4. Say: "I need to go on Saturday"
5. Select flight option
6. Confirm change

**Demo Flow 2: New Booking (3 min)**
1. Click "Talk to AA"
2. Say: "I want to book a flight"
3. Provide origin, destination, date
4. Select from options
5. Provide passenger name
6. Receive confirmation

**Demo Flow 3: Family Helper**
1. Start conversation as passenger
2. Click "Share with Family"
3. Open link in new tab
4. View live transcript
5. Send suggestion
6. Hear suggestion read aloud

---

## Deployment

**Infrastructure:**
- Vultr cloud hosting
- Nginx reverse proxy
- Gunicorn WSGI server
- SQLite (dev) / PostgreSQL (prod)

**Commands:**
```bash
# Backend
cd backend && python manage.py runserver 0.0.0.0:8001

# Frontend
cd frontend && npm run dev

# Docker
docker-compose up
```

---

## Success Metrics

| Metric | Goal |
|--------|------|
| Task Completion Rate | > 90% for flight changes |
| Voice Recognition Accuracy | > 95% |
| User Satisfaction | > 4.5/5 rating |
| Call Duration | < 3 minutes average |
| Family Helper Adoption | > 30% of sessions |

---

## Implemented Features (formerly Future Enhancements)

- [x] Seat selection interface (via helper actions)
- [x] Baggage management (add bags via voice or helper)
- [x] Wheelchair assistance (request via voice or helper)
- [x] IROP handling (delays, cancellations, missed connections)
- [x] Location tracking (GPS, gate distance, walking time)
- [x] Caregiver full action capabilities

## Future Enhancements

- [ ] Multi-passenger bookings
- [ ] Loyalty program integration
- [ ] Push notifications for helpers
- [ ] Offline mode
- [ ] Additional languages (French, German, etc.)
- [ ] Real AA API integration (currently mock data)
- [ ] Airport indoor maps integration
- [ ] Proactive delay notifications via outbound calls

---

## References

- [Google Gemini API](https://ai.google.dev/docs)
- [ElevenLabs Conversational AI](https://elevenlabs.io/docs/conversational-ai)
- [ElevenLabs TTS API](https://elevenlabs.io/docs)
- [AA Flight-Engine](https://github.com/AmericanAirlines/Flight-Engine)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
