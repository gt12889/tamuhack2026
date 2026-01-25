# Elder Strolls

Voice-first travel assistance for elderly passengers.

**TAMUHack 2026** | Gemini | ElevenLabs | Vultr

**Phone:** +1 (877) 211-0332

## Overview

Elder Strolls enables elderly passengers to manage their flights through natural voice conversation, providing a comfortable self-service experience. Family caregivers can assist remotely with full action capabilities.

### Key Features

- **Voice-First Interface**: Full two-way voice conversation using ElevenLabs Conversational AI
- **AI-Powered Understanding**: Gemini processes natural language requests
- **Large, Accessible UI**: Minimum 24px fonts, 60px touch targets, high contrast
- **Family Helper Mode**: Share a link so relatives can assist remotely with FULL action capabilities
- **Flight Changes**: Look up reservations and change flights via voice
- **IROP Handling**: Automatic disruption detection with rebooking options for delays, cancellations, and missed connections
- **Location Tracking**: Real-time GPS tracking with gate distance, walking time estimates, and alerts
- **Wheelchair & Bags**: Request wheelchair assistance and add bags via voice or helper

### Caregiver (Family Helper) Actions

Family members can remotely perform these actions for elderly passengers:
- **Change Flight** - Rebook to alternative flights
- **Cancel Flight** - Cancel the reservation
- **Select Seat** - Choose preferred seat
- **Add Bags** - Add checked baggage
- **Request Wheelchair** - Request wheelchair assistance
- **Accept Rebooking** - Accept airline-proposed rebooking during disruptions
- **Acknowledge Disruption** - Acknowledge flight disruption notifications

### IROP (Irregular Operations) Handling

The system handles flight disruptions automatically:
- **Delays**: Detects delays, shows updated times, offers rebooking
- **Cancellations**: Detects cancellations, presents rebooking options
- **Missed Connections**: Analyzes connection risk, offers alternatives
- **Rebooking Flow**: Caregiver can accept/decline proposed rebookings

### Location Tracking

Real-time passenger location monitoring:
- GPS coordinates with accuracy
- Distance to departure gate (feet/meters)
- Walking time estimates to gate
- Alert statuses: `safe`, `warning`, `urgent`, `arrived`
- Automatic alerts when passenger is at risk of missing flight

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Gemini API key
- ElevenLabs API key (optional, has fallback)

### Local Development

1. **Clone and setup backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your API keys
   python manage.py migrate
   python manage.py runserver
   ```

2. **Setup frontend (new terminal):**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

3. **Open http://localhost:3000**

### Docker (Alternative)

```bash
# Set API keys
export GEMINI_API_KEY=your-key
export ELEVENLABS_API_KEY=your-key

# Start services
docker-compose up
```

## Demo

Use voice-friendly confirmation codes to test:

| Code | Passenger | Route | Scenario |
|------|-----------|-------|----------|
| **MEEMAW** | Margaret Johnson | DFW → ORD | English, standard |
| **GRANNY** | Maria Garcia | MIA → SJU | Spanish, IROP delay |
| **PAPA44** | Robert Smith | LAX → JFK → MIA | Multi-segment |
| **NANA55** | Eleanor Williams | ORD → PHX | Family booking |

### Basic Flow
1. Click "Talk to Elder Strolls" or call +1 (877) 211-0332
2. Say "I need to change my flight"
3. Say "MEEMAW" when asked for confirmation code
4. Say "I need to fly tomorrow instead"
5. Confirm the new flight

### Family Helper Flow
1. Start conversation as passenger
2. Click "Share with Family"
3. Open link in new tab (or phone)
4. View live transcript
5. Click action buttons to help (change flight, add bags, etc.)
6. Send text suggestions that are read aloud

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TailwindCSS |
| Voice Agent | ElevenLabs Conversational AI |
| Voice Input | Web Speech API (fallback) |
| Voice Output | ElevenLabs TTS API |
| AI/NLU | Google Gemini API |
| Backend | Python Django, DRF |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Maps | Mapbox GL JS (location tracking) |

## Project Structure

```
tamuhack2026/
├── frontend/           # Next.js app
│   ├── src/
│   │   ├── app/        # Pages and layouts
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom hooks (speech, audio)
│   │   ├── lib/        # API client
│   │   └── types/      # TypeScript types
│   └── package.json
├── backend/            # Django API
│   ├── api/            # Main API app
│   │   ├── services/   # Gemini, ElevenLabs integrations
│   │   ├── models.py   # Database models
│   │   ├── views.py    # API endpoints
│   │   └── mock_data.py
│   └── voice_concierge/  # Django settings
├── tasks/              # PRD documentation
└── docker-compose.yml
```

## API Endpoints

### Core Conversation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversation/start` | POST | Start new session |
| `/api/conversation/message` | POST | Send voice transcript |
| `/api/reservation/lookup` | GET | Look up by code/name |
| `/api/voice/synthesize` | POST | Text-to-speech |

### Family Helper
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/helper/create-link` | POST | Create family helper link |
| `/api/helper/create-area-mapping-link` | POST | Create area mapping link |
| `/api/helper/{link_id}` | GET | Get helper session |
| `/api/helper/{link_id}/suggest` | POST | Send suggestion |
| `/api/helper/{link_id}/actions` | GET | Get available actions |
| `/api/helper/{link_id}/actions/change-flight` | POST | Change passenger's flight |
| `/api/helper/{link_id}/actions/cancel-flight` | POST | Cancel flight |
| `/api/helper/{link_id}/actions/select-seat` | POST | Select seat |
| `/api/helper/{link_id}/actions/add-bags` | POST | Add bags |
| `/api/helper/{link_id}/actions/request-wheelchair` | POST | Request wheelchair |
| `/api/helper/{link_id}/flights` | GET | Get available flights |
| `/api/helper/{link_id}/seats` | GET | Get available seats |

### IROP (Disruption Handling)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/helper/{link_id}/irop-status` | GET | Get disruption status |
| `/api/helper/{link_id}/actions/accept-rebooking` | POST | Accept rebooking |
| `/api/helper/{link_id}/actions/acknowledge-disruption` | POST | Acknowledge disruption |

### Location Tracking
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/location/update` | POST | Update passenger location |
| `/api/location/alert` | POST | Trigger location alert |
| `/api/location/{session_id}/history` | GET | Get location history |
| `/api/location/{session_id}/alerts` | GET | Get location alerts |
| `/api/location/alerts/{alert_id}/acknowledge` | POST | Acknowledge alert |
| `/api/helper/{link_id}/location` | GET | Get helper location view |

### ElevenLabs Conversational AI
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/elevenlabs/convai/status` | GET | Check ElevenLabs status |
| `/api/elevenlabs/convai/web-call` | POST | Start web call |
| `/api/elevenlabs/convai/webhook` | POST | Server tool webhook |
| `/api/elevenlabs/convai/tools` | GET | Get tool definitions |

### Flight-Engine Integration
Uses [AA Flight-Engine API](https://github.com/AmericanAirlines/Flight-Engine) for realistic mock flight data.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/flights/?date=YYYY-MM-DD` | GET | Get all flights for date |
| `/api/flights/search?origin=DFW&destination=ORD` | GET | Search flights between airports |
| `/api/airports/` | GET | Get all airports |
| `/api/health/` | GET | Health check |

## Environment Variables

### Backend (.env)
```
GEMINI_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
DJANGO_SECRET_KEY=your-secret
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Team

TAMUHack 2026

## License

MIT
