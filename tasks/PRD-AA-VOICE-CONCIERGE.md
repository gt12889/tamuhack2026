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

**Purpose:** Allow remote family members to view conversations and send suggestions.

**Features:**
- Generate unique shareable link (8-character URL-safe token)
- Real-time conversation view (3-second polling)
- Passenger information dashboard
- Flight status cards with countdown timers
- Send text suggestions (read aloud to passenger)
- Session expiry (30 minutes)

**Dashboard Components:**
- PassengerInfoCard: Name, email, phone, AAdvantage#, preferences
- FlightStatusCard: Flight#, route, times, gate, seat, status badge, countdown
- Conversation transcript with role indicators
- Suggestion input form

**Security:**
- Links expire with session
- No authentication required (token-based access)
- Limited to read + suggest (no modifications)

---

### 4. Real-Time Voice Calls (Retell AI)

**Phone Number:** +1 (863) 341-8574

**Capabilities:**
- Web-based voice calls (WebSocket)
- Outbound phone calls
- Real-time transcription
- Function calling for backend operations

**Available Functions:**
| Function | Description |
|----------|-------------|
| `lookup_reservation` | Find by confirmation code |
| `change_flight` | Reschedule to new date |
| `create_booking` | Book new flight |
| `get_flight_options` | Search available flights |
| `get_reservation_status` | Check booking status |

**Webhook Events:**
- `call_started` - Initialize session
- `call_ended` - Store transcript
- `call_analyzed` - Post-call analytics
- `function_call` - Execute backend logic

---

### 5. Flight Information

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

**Demo Reservations:**
| Code | Passenger | Route | Language |
|------|-----------|-------|----------|
| DEMO123 | Margaret Johnson | DFW → ORD | English |
| TEST456 | Robert Smith | LAX → JFK → MIA | English |
| ABUELA1 | Maria Garcia | MIA → SJU | Spanish |

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
| ElevenLabsService | Text-to-speech | ElevenLabs Turbo v2.5 |
| RetellService | Real-time voice calls | Retell AI Platform |
| FlightEngineService | Flight data | AA Flight-Engine |

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

## Future Enhancements

- [ ] Multi-passenger bookings
- [ ] Seat selection interface
- [ ] Baggage management
- [ ] Loyalty program integration
- [ ] Push notifications
- [ ] Offline mode
- [ ] Additional languages (French, German, etc.)

---

## References

- [Google Gemini API](https://ai.google.dev/docs)
- [ElevenLabs API](https://elevenlabs.io/docs)
- [Retell AI Platform](https://retellai.com/docs)
- [AA Flight-Engine](https://github.com/AmericanAirlines/Flight-Engine)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
