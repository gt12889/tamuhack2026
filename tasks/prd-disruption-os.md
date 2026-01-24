# PRD: Disruption OS

## Introduction

**Disruption OS** is an AI-powered disruption recovery system for American Airlines that transforms chaotic irregular operations (IROPs) into guided, proactive passenger experiences. When delays, cancellations, or gate changes occur, passengers receive personalized recovery plans with rebooking options, real-time updates, and multilingual voice guidance—reducing confusion and gate agent workload.

**Hackathon:** TAMUHack 2026
**Tracks:** American Airlines (Main) | Gemini | ElevenLabs | Vultr

---

## Goals

- Provide passengers with **proactive, personalized recovery plans** during disruptions
- Deliver **real-time updates** via push notifications and voice announcements
- Support **multilingual communication** using ElevenLabs voice synthesis
- Use **Gemini AI** to generate intelligent rebooking recommendations
- Demonstrate **measurable operational improvements** (reduced gate agent queries, faster rebooking)
- Deploy simulation backend on **Vultr** infrastructure

---

## User Stories

### Phase 1: Core Passenger Experience (MVP)

#### US-001: Flight status ingestion
**Description:** As the system, I need to ingest flight data from AA API and mock disruption events so passengers see real-time status.

**Acceptance Criteria:**
- [ ] Django backend connects to American Airlines API for flight data
- [ ] Mock disruption generator can inject delays, cancellations, gate changes
- [ ] Flight status updates propagate to frontend within 5 seconds
- [ ] Data models: Flight, Disruption, Passenger, Booking
- [ ] API endpoints: `GET /api/flights/{id}`, `GET /api/flights/{id}/status`

#### US-002: Passenger authentication and booking lookup
**Description:** As a passenger, I want to enter my confirmation code to see my itinerary so I can track my flights.

**Acceptance Criteria:**
- [ ] Login page accepts confirmation code (PNR) or email lookup
- [ ] Displays passenger's full itinerary with flight segments
- [ ] Shows current status for each flight (on-time, delayed, cancelled, gate change)
- [ ] Mock passenger data seeded for demo
- [ ] Responsive design works on mobile

#### US-003: Disruption detection and notification
**Description:** As a passenger, I want to be notified immediately when my flight is disrupted so I can take action.

**Acceptance Criteria:**
- [ ] System detects disruption events (delay >30min, cancellation, gate change)
- [ ] Push notification sent to passenger's browser/device
- [ ] Notification includes: disruption type, impact summary, CTA to view recovery options
- [ ] Disruption banner appears on passenger's itinerary view
- [ ] Timestamp and reason displayed when available

#### US-004: AI-generated recovery plan
**Description:** As a passenger, I want to see personalized rebooking options so I can choose the best alternative.

**Acceptance Criteria:**
- [ ] Gemini API generates recovery recommendations based on:
  - Original itinerary and destination
  - Available alternative flights
  - Passenger preferences (if known)
  - Connection requirements
- [ ] Displays 2-3 ranked options with pros/cons
- [ ] Each option shows: new flight times, layovers, seat availability
- [ ] "Accept" button to confirm rebooking selection
- [ ] Fallback options if no direct alternatives exist

#### US-005: One-click rebooking
**Description:** As a passenger, I want to rebook with one click so I don't have to wait in line or call.

**Acceptance Criteria:**
- [ ] Passenger selects preferred recovery option
- [ ] System confirms new booking (mock confirmation)
- [ ] Updated itinerary displays immediately
- [ ] Confirmation notification sent
- [ ] New boarding pass available for download (mock PDF)

#### US-006: Multilingual voice announcements
**Description:** As a passenger, I want to hear announcements in my preferred language so I understand what's happening.

**Acceptance Criteria:**
- [ ] ElevenLabs API generates voice announcements for disruptions
- [ ] Supports 2 languages: English, Spanish
- [ ] Pre-made professional ElevenLabs voices (no custom cloning)
- [ ] Audio player in-app for on-demand playback
- [ ] Announcements include: flight status, gate info, next steps
- [ ] Language selector toggle in UI

#### US-007: Real-time status dashboard
**Description:** As a passenger, I want a live dashboard showing my flight status so I always know what's happening.

**Acceptance Criteria:**
- [ ] Dashboard shows: current status, gate, boarding time, delay reason
- [ ] Auto-refreshes every 30 seconds (WebSocket or polling)
- [ ] Visual indicators: green (on-time), yellow (delayed), red (cancelled)
- [ ] Timeline view of disruption history
- [ ] Connection status for multi-leg trips

---

### Phase 2: Gate Agent Copilot (Stretch Goal)

#### US-008: Agent dashboard overview
**Description:** As a gate agent, I want to see all affected passengers for my flight so I can prioritize assistance.

**Acceptance Criteria:**
- [ ] Dashboard shows passenger list sorted by: tight connections, elite status, unaccompanied minors
- [ ] Each passenger shows: name, connection risk, rebooking status, special needs
- [ ] Filter by: needs attention, already rebooked, checked-in
- [ ] Real-time count of passengers needing assistance

#### US-009: AI-assisted announcement generation
**Description:** As a gate agent, I want AI to draft announcements so I can communicate clearly and quickly.

**Acceptance Criteria:**
- [ ] Gemini generates announcement scripts based on current disruption
- [ ] Agent can edit before broadcasting
- [ ] Templates for: delay update, gate change, boarding call, cancellation
- [ ] One-click send to passenger devices + overhead PA (simulated)

#### US-010: Passenger prioritization queue
**Description:** As a gate agent, I want the system to prioritize which passengers need help first so I can be efficient.

**Acceptance Criteria:**
- [ ] AI-ranked queue based on: connection time, rebooking complexity, loyalty status
- [ ] "Next passenger" button pulls highest priority
- [ ] Quick-action buttons: rebook, meal voucher, hotel, lounge access
- [ ] Mark as resolved to remove from queue

---

## Functional Requirements

### Data Layer
- FR-1: Django models for Flight, Disruption, Passenger, Booking, RecoveryOption
- FR-2: American Airlines API integration for flight schedules and status
- FR-3: Mock data generator for passengers, bookings, and disruption events
- FR-4: WebSocket or SSE for real-time status updates to frontend

### AI/ML Layer
- FR-5: Gemini API integration for recovery plan generation
- FR-6: Prompt engineering for rebooking recommendations with passenger context
- FR-7: Gemini integration for announcement script generation (stretch)

### Voice Layer
- FR-8: ElevenLabs API integration for text-to-speech
- FR-9: Support for English and Spanish voice synthesis
- FR-10: Audio caching to reduce API calls for repeated announcements

### Frontend Layer
- FR-11: Next.js app with responsive mobile-first design
- FR-12: Passenger login/lookup by confirmation code
- FR-13: Real-time flight status dashboard with visual indicators
- FR-14: Recovery options carousel with one-click rebooking
- FR-15: In-app audio player for voice announcements
- FR-16: Push notification support (browser notifications)

### Infrastructure Layer
- FR-17: Django backend deployed on Vultr
- FR-18: PostgreSQL database for persistent data
- FR-19: Redis for real-time pub/sub (optional)
- FR-20: Next.js frontend deployed on Vultr or Vercel

---

## Non-Goals (Out of Scope)

- Actual integration with AA's production booking systems
- Real payment processing or ticket issuance
- Native mobile apps (iOS/Android)—web PWA only
- Crew scheduling or aircraft assignment optimization
- Baggage tracking integration
- Loyalty program point calculations
- Multi-airline alliance rebooking
- Historical analytics or reporting dashboards

---

## Technical Considerations

### API Integrations
- **American Airlines API:** Flight schedules, status, gates (real data where available)
- **Gemini API:** `gemini-pro` or `gemini-1.5-flash` for fast responses
- **ElevenLabs API:** Multilingual TTS with professional voice cloning
- **Vultr:** Compute instances for Django, managed PostgreSQL

### Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Django API     │────▶│  PostgreSQL     │
│   (Passenger)   │     │  (Vultr)        │     │  (Vultr)        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Gemini   │ │ElevenLabs│ │  AA API  │
              │   API    │ │   API    │ │          │
              └──────────┘ └──────────┘ └──────────┘
```

### Mock Data Strategy
- Seed 5-10 flights with realistic AA flight numbers (AA1234)
- Pre-generate 20-30 mock passengers with varied itineraries
- Disruption scenarios: 45-min delay, cancellation, gate change A→B
- Demo mode: trigger disruptions via admin panel or scheduled events

---

## Demo Scenario

**"The DFW Thunderstorm"**

1. Passenger logs in with confirmation code `ABC123`
2. Shows itinerary: DFW → ORD → BOS (connecting flight)
3. Disruption triggers: DFW→ORD delayed 90 minutes
4. Notification appears: "Your flight is delayed. Connection at risk."
5. AI generates 3 recovery options:
   - Option A: Same flight, tight 25-min connection (risky)
   - Option B: Rebook to direct DFW→BOS flight (recommended)
   - Option C: Next day morning flight + hotel voucher
6. Passenger selects Option B, one-click rebooks
7. Voice announcement plays in Spanish: "Su vuelo ha sido reprogramado..."
8. New itinerary displays with confirmation

---

## Success Metrics (Demo)

- Passenger can view disruption and recovery options in <10 seconds
- Rebooking completes in 1 click (vs. typical 15+ min call/line wait)
- Voice announcements generate in <3 seconds
- System handles 3 disruption types: delay, cancellation, gate change
- Demo runs end-to-end without errors for judges

---

## Decisions Made

| Question | Decision |
|----------|----------|
| **AA API** | Real flight data from AA API + mock disruption events |
| **ElevenLabs Voice** | Pre-made professional voices (faster setup) |
| **Vultr Tier** | Free tier / hackathon credits (small compute + managed Postgres) |
| **Auth** | Simple PNR lookup only (no login friction) |
| **Offline Mode** | Not needed - assume internet for demo |
| **Languages** | English + Spanish (2 languages) |
| **Team Size** | 4 people (mobile app, Figma design, backend, frontend/integration) - PRD scoped for web frontend focus |

---

## Implementation Order

### Phase 1: Foundation (Must Have)
1. Project scaffolding: Next.js + Django + Docker Compose
2. US-001: Flight data models + AA API integration + mock disruptions
3. US-002: Passenger PNR lookup + itinerary display

### Phase 2: Core Disruption Flow (Must Have)
4. US-003: Disruption detection + browser notifications
5. US-004: Gemini integration for recovery plan generation
6. US-005: One-click rebooking (mock confirmation)

### Phase 3: Voice + Polish (Should Have)
7. US-006: ElevenLabs English + Spanish announcements
8. US-007: Real-time dashboard with visual polish
9. Deploy to Vultr

### Phase 4: Stretch (Nice to Have)
10. Gate agent copilot (US-008-010)

### Team Notes
- **Mobile app team:** Parallel native implementation consuming same Django API
- **Figma design:** Provides UI specs for frontend teams
- **Backend team:** Django API, Gemini/ElevenLabs integrations, Vultr deployment
- **This PRD:** Focuses on web frontend (Next.js) + integration

### Critical Path for Judges
**Minimum demo:** PNR lookup → see disruption → Gemini options → one-click rebook → Spanish voice

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TailwindCSS |
| Backend | Python Django, Django REST Framework |
| Database | PostgreSQL (Vultr managed) |
| AI | Google Gemini API |
| Voice | ElevenLabs TTS API |
| Hosting | Vultr (backend), Vultr/Vercel (frontend) |
| Real-time | WebSockets or Server-Sent Events |

