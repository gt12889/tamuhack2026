# End-to-End Feature Test Plan

## Landing Page (Hackathon Showcase)

**Access**: Click on the AA logo icon in the header, or navigate to `/about`

### Features Showcased on Landing Page:
1. **Voice-First Interface** - Web Speech API + ElevenLabs TTS
2. **Google Gemini AI** - Gemini 2.0 Flash for intent detection
3. **Bilingual Support** - English + Spanish auto-detection
4. **Family Helper Mode** - Remote assistance via shareable links
5. **Email Confirmations** - Resend API with bilingual templates
6. **Elderly-Friendly Design** - Large fonts, high contrast, 60px touch targets

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
curl http://localhost:8001/api/health

# Email service status
curl http://localhost:8001/api/email/status

# Retell status
curl http://localhost:8001/api/retell/status
```

### Expected Results
- Health: `{"status": "healthy", "database": "connected"}`
- Email: `{"configured": true, "service": "Resend Email Service"}`
- Retell: `{"configured": true/false, "service": "Retell AI Voice Agent"}`

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

# Step 3: Provide confirmation code
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "My confirmation code is DEMO123"}'

# Step 4: Confirm the change
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "Yes, please book that flight"}'
```

### Expected Results
- `detected_language: "en"`
- `intent` progression: greeting → change_flight → confirm_action
- `email_sent: true` on confirmation
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
  -d '{"session_id": "'$SESSION_ID'", "transcript": "Mi código es DEMO123"}'

# Step 3: Confirm in Spanish
curl -X POST http://localhost:8001/api/conversation/message \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'", "transcript": "Sí, por favor reserve ese vuelo"}'
```

### Expected Results
- `detected_language: "es"`
- Responses in Spanish
- Email sent in Spanish
- Trip summary in Spanish

---

## Test 4: Email Delivery

### Direct Email Test
```bash
# First, get a reservation ID
curl http://localhost:8001/api/reservations/ | jq '.[0].id'

# Send booking confirmation email
curl -X POST http://localhost:8001/api/email/booking-confirmation \
  -H "Content-Type: application/json" \
  -d '{"reservation_id": "<reservation_id>", "language": "en"}'

# Send flight change email
curl -X POST http://localhost:8001/api/email/flight-change \
  -H "Content-Type: application/json" \
  -d '{
    "reservation_id": "<reservation_id>",
    "original_flight": {
      "flight_number": "AA1234",
      "origin": "DFW",
      "destination": "ORD",
      "departure_time": "2026-01-24T14:00:00"
    },
    "new_flight": {
      "flight_number": "AA1234",
      "origin": "DFW",
      "destination": "ORD",
      "departure_time": "2026-01-25T14:00:00"
    },
    "language": "en"
  }'
```

### Expected Results
- `success: true`
- `email_id` returned
- Check inbox for actual email delivery

---

## Test 5: Family Helper Link

### Create Helper Link
```bash
# Create helper link for session
curl -X POST http://localhost:8001/api/helper/create \
  -H "Content-Type: application/json" \
  -d '{"session_id": "'$SESSION_ID'"}'
```

### Access Helper Dashboard
```bash
# Get helper session data
curl http://localhost:8001/api/helper/<link_id>
```

### Expected Results
- `helper_link` returned
- Helper dashboard accessible at `/help/<link_id>`
- Shows passenger info, flight status, conversation

---

## Test 6: Gemini Trip Summary

### Test Summary Generation
```python
# Python test script
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'voice_concierge.settings'

import django
django.setup()

from api.services import GeminiService

gemini = GeminiService()

# Test booking summary
reservation_data = {
    'confirmation_code': 'DEMO123',
    'passenger': {'first_name': 'Margaret', 'last_name': 'Johnson'},
    'flights': [{
        'flight_number': 'AA1234',
        'origin': 'DFW',
        'destination': 'ORD',
        'departure_time': '2026-01-25T14:00:00',
        'seat': '14A'
    }]
}

# English summary
result_en = gemini.generate_trip_summary(reservation_data, 'en')
print("English:", result_en['summary'])

# Spanish summary
result_es = gemini.generate_trip_summary(reservation_data, 'es')
print("Spanish:", result_es['summary'])
```

### Expected Results
- English summary includes route, date, seat, confirmation code
- Spanish summary same info in Spanish with formal "usted" form

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
curl http://localhost:8001/api/airports

# Search flights
curl "http://localhost:8001/api/flights?date=2026-01-25&origin=DFW&destination=ORD"

# Search route
curl "http://localhost:8001/api/flights/search?origin=DFW&destination=ORD&date=2026-01-25"
```

### Expected Results
- List of airports returned
- Flight options for route and date
- Alternative flights available

---

## Test 9: Frontend Sample Demo

### Manual Browser Test
1. Navigate to http://localhost:3000
2. Click "Try Demo" button
3. Click "Sample Demo" toggle in header
4. Click "Start Demo" button
5. Watch automated workflow play through
6. Toggle to Spanish with "Español" button
7. Click "Restart" and run Spanish demo

### Expected Results
- Demo plays through 9-step flight change workflow
- Messages animate in sequence
- FlightCard shows current reservation
- TripSummaryCard shows at completion
- Spanish mode shows all content in Spanish
- Browser TTS available for agent messages

---

## Test 10: Frontend Live Demo

### With Retell Configured
1. Navigate to http://localhost:3000
2. Click "Try Demo"
3. Click "Start Web Call" (if Retell configured)
4. Speak: "I need to change my flight"
5. Provide confirmation code when asked
6. Confirm the change

### Expected Results
- Real-time transcript appears
- Voice responses from agent
- Email sent on confirmation

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
| English Conversation | ⬜ | |
| Spanish Detection | ⬜ | |
| Spanish Responses | ⬜ | |
| Email - English | ⬜ | |
| Email - Spanish | ⬜ | |
| Family Helper Link | ⬜ | |
| Trip Summary - EN | ⬜ | |
| Trip Summary - ES | ⬜ | |
| TTS - English | ⬜ | |
| TTS - Spanish | ⬜ | |
| Flight Search | ⬜ | |
| Sample Demo | ⬜ | |
| Live Demo | ⬜ | |
| CRUD APIs | ⬜ | |

---

## Quick Test Commands

```bash
# Run all backend tests
cd backend
python manage.py test

# Check all services
curl -s http://localhost:8001/api/health | jq
curl -s http://localhost:8001/api/email/status | jq
curl -s http://localhost:8001/api/retell/status | jq

# Full conversation test
./scripts/test-conversation.sh
```
