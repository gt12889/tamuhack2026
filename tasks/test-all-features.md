# End-to-End Feature Test Plan

## Landing Page (Hackathon Showcase)

**Access**: Click on the AA logo icon in the header, or navigate to `/about`

### Features Showcased on Landing Page:
1. **Voice-First Interface** - Web Speech API + ElevenLabs Conversational AI
2. **Google Gemini AI** - Gemini 2.0 Flash for intent detection
3. **Bilingual Support** - English + Spanish auto-detection
4. **Family Helper Mode** - Remote assistance via shareable links with FULL action capabilities
5. **IROP Handling** - Automatic disruption detection with rebooking
6. **Location Tracking** - Real-time GPS with gate distance
7. **Elderly-Friendly Design** - Large fonts, high contrast, 60px touch targets

### Interactive Elements:
- Auto-rotating demo flow tabs (Flight Rebooking, Family Helper, Spanish Support)
- Animated feature cards with hover effects
- Tech stack visualization with category badges
- Problem/Solution comparison section
- Stats display (6+ AI Features, 2 Languages, 12+ Tech Integrations, 24/7)

### To Test:
1. Navigate to http://localhost:3000
2. Click the AA logo in the header
3. Verify all sections load with animations
4. Test interactive demo flow tab switching
5. Click "Try Demo" button to return to main app

---

## Overview
Comprehensive test of all AA Voice Concierge features with sample workflows.

## Test Environment Setup
- Backend: http://localhost:8001
- Frontend: http://localhost:3000
- Database: PostgreSQL (Supabase) or SQLite

---

## Test 1: Backend Health Check

### API Endpoints to Verify
```bash
# Health check
curl http://localhost:8001/api/health/

# ElevenLabs Conversational AI status
curl http://localhost:8001/api/elevenlabs/convai/status
```

### Expected Results
- Health: `{"status": "healthy", "database": "connected"}`
- ElevenLabs: `{"configured": true, "service": "ElevenLabs Conversational AI"}`

---

## Test 2: Conversation Flow - English

### Start Session
```bash
curl -X POST http://localhost:8001/api/conversation/start \
  -H "Content-Type: application/json"
```

### Workflow: Flight Change (English)
```bash
# Step 1: Greeting response
SESSION_ID="<from above>"

# Step 2: User wants to change flight
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "I need to change my flight"}'

# Step 3: Provide confirmation code (voice-friendly)
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "My confirmation code is MEEMAW"}'

# Step 4: Confirm the change
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "Yes, please book that flight"}'
```

### Expected Results
- `detected_language: "en"`
- `intent` progression: greeting → change_flight → confirm_action
- Trip summary generated in English

---

## Test 3: Conversation Flow - Spanish

### Workflow: Flight Change (Spanish)
```bash
# Start new session
curl -X POST http://localhost:8001/api/conversation/start

# Step 1: Spanish greeting
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "Hola, necesito cambiar mi vuelo"}'

# Step 2: Provide code in Spanish
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "Mi código es GRANNY"}'

# Step 3: Confirm in Spanish
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "Sí, por favor reserve ese vuelo"}'
```

### Expected Results
- `detected_language: "es"`
- Responses in Spanish
- Trip summary in Spanish

---

## Test 4: Family Helper Link

### Create Helper Link
```bash
# Create helper link for session
curl -X POST http://localhost:8001/api/helper/create-link \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'"}'
```

### Access Helper Dashboard
```bash
# Get helper session data
curl http://localhost:8001/api/helper/<link_id>
```

### Test Helper Actions
```bash
# Get available actions
curl http://localhost:8001/api/helper/<link_id>/actions

# Request wheelchair
curl -X POST http://localhost:8001/api/helper/<link_id>/actions/request-wheelchair \
  -H "Content-Type: application/json"

# Add bags
curl -X POST http://localhost:8001/api/helper/<link_id>/actions/add-bags \
  -H "Content-Type: application/json" \
  -d '{"bag_count": 2}'
```

### Expected Results
- `helper_link` returned
- Helper dashboard accessible at `/help/<link_id>`
- Shows passenger info, flight status, conversation
- Actions execute successfully

---

## Test 5: IROP Status

### Check Disruption Status
```bash
curl http://localhost:8001/api/helper/<link_id>/irop-status
```

### Accept Rebooking (if IROP active)
```bash
curl -X POST http://localhost:8001/api/helper/<link_id>/actions/accept-rebooking \
  -H "Content-Type: application/json" \
  -d '{"rebooking_option_id": "1"}'
```

### Expected Results
- Returns IROP status (delay/cancellation/missed_connection or none)
- Rebooking options if disruption active
- Accept/acknowledge actions work

---

## Test 6: Location Tracking

### Update Location
```bash
curl -X POST http://localhost:8001/api/location/update \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "latitude": 32.8998,
    "longitude": -97.0403,
    "accuracy": 10
  }'
```

### Get Location History
```bash
curl http://localhost:8001/api/location/$SESSION_ID/history
```

### Get Helper Location View
```bash
curl http://localhost:8001/api/helper/<link_id>/location
```

### Expected Results
- Location update stored
- Gate distance calculated
- Walking time estimated
- Alert status returned (safe/warning/urgent/arrived)

---

## Test 7: ElevenLabs TTS

### Test Voice Synthesis
```bash
# English voice
curl -X POST http://localhost:8001/api/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Your flight has been confirmed.", "language": "en"}'

# Spanish voice
curl -X POST http://localhost:8001/api/voice/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Su vuelo ha sido confirmado.", "language": "es"}'
```

### Expected Results
- `audio_url` returned (base64 data URL or null for fallback)
- English uses voice ID: EXAVITQu4vr4xnSDxMaL
- Spanish uses voice ID: ErXwobaYiN019PkySvjV

---

## Test 8: Flight Engine API

### Search Flights
```bash
# Get airports
curl http://localhost:8001/api/airports/

# Search flights
curl "http://localhost:8001/api/flights/?date=2026-01-25&origin=DFW&destination=ORD"

# Search route
curl "http://localhost:8001/api/flights/search?origin=DFW&destination=ORD&date=2026-01-25"
```

### Expected Results
- List of airports returned
- Flight options for route and date
- Alternative flights available

---

## Test 9: Frontend Live Demo

### With ElevenLabs Configured
1. Navigate to http://localhost:3000
2. Click "Try Demo"
3. Click "Start Web Call" (if ElevenLabs configured)
4. Speak: "I need to change my flight"
5. Say: "MEEMAW" when asked for confirmation code
6. Confirm the change

### Expected Results
- Real-time transcript appears
- Voice responses from agent
- Flight details shown

---

## Test 10: ElevenLabs Webhook Tools

### Test via ElevenLabs Dashboard
1. Go to ElevenLabs dashboard > Agent > Test
2. Say: "Look up my reservation"
3. When asked for code, say: "MEEMAW"
4. Verify tool calls in webhook logs

### Expected Webhook Tools (11 total):
- `lookup_reservation`
- `change_flight`
- `create_booking`
- `get_flight_options`
- `get_reservation_status`
- `create_family_helper_link`
- `check_flight_delays`
- `get_gate_directions`
- `request_wheelchair`
- `add_bags`
- `get_irop_rebooking_options`

---

## Test 11: CRUD API Endpoints

### Test All ViewSets
```bash
# Passengers
curl http://localhost:8001/api/passengers/
curl -X POST http://localhost:8001/api/passengers/ \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Test", "last_name": "User", "email": "test@example.com"}'

# Reservations
curl http://localhost:8001/api/reservations/

# Flights
curl http://localhost:8001/api/flights-db/

# Sessions
curl http://localhost:8001/api/sessions/

# Messages
curl http://localhost:8001/api/messages/
```

---

## Success Criteria

| Feature | Status | Notes |
|---------|--------|-------|
| Backend Health | ⬜ | |
| ElevenLabs Status | ⬜ | |
| English Conversation | ⬜ | |
| Spanish Detection | ⬜ | |
| Spanish Responses | ⬜ | |
| Family Helper Link | ⬜ | |
| Helper Actions | ⬜ | Change, Cancel, Seat, Bags, Wheelchair |
| IROP Status | ⬜ | |
| Accept Rebooking | ⬜ | |
| Location Update | ⬜ | |
| Location Alerts | ⬜ | |
| TTS - English | ⬜ | |
| TTS - Spanish | ⬜ | |
| Flight Search | ⬜ | |
| Live Demo | ⬜ | |
| Webhook Tools | ⬜ | All 11 tools |
| CRUD APIs | ⬜ | |

---

## Demo Confirmation Codes (Voice-Friendly)

| Code | Passenger | Route | Scenario |
|------|-----------|-------|----------|
| MEEMAW | Margaret Johnson | DFW -> ORD | English, standard |
| GRANNY | Maria Garcia | MIA -> SJU | Spanish, IROP delay |
| PAPA44 | Robert Smith | LAX -> JFK -> MIA | Multi-segment |
| NANA55 | Eleanor Williams | ORD -> PHX | Family booking |

---

## Quick Test Commands

```bash
# Run all backend tests
cd backend
python manage.py test

# Check all services
curl -s http://localhost:8001/api/health/ | jq
curl -s http://localhost:8001/api/elevenlabs/convai/status | jq

# Full conversation test
./scripts/test-conversation.sh
```
