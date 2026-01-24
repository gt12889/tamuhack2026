# AA Voice Concierge

Voice-first flight assistance for elderly American Airlines passengers.

**TAMUHack 2026** | American Airlines Track | Gemini | ElevenLabs | Vultr

## Overview

AA Voice Concierge enables elderly passengers to manage their flights through natural voice conversation, reducing calls to AA's reservation hotline while providing a comfortable self-service experience.

### Key Features

- **Voice-First Interface**: Full two-way voice conversation using Web Speech API and ElevenLabs
- **AI-Powered Understanding**: Gemini processes natural language requests
- **Large, Accessible UI**: Minimum 24px fonts, 60px touch targets, high contrast
- **Family Helper Mode**: Share a link so relatives can assist remotely
- **Flight Changes**: Look up reservations and change flights via voice

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

Use confirmation code **DEMO123** to test the full flow:

1. Click "Talk to AA"
2. Say "I need to change my flight"
3. Spell out "D-E-M-O-1-2-3" when asked for confirmation code
4. Say "I need to fly tomorrow instead"
5. Confirm the new flight

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TailwindCSS |
| Voice Input | Web Speech API |
| Voice Output | ElevenLabs TTS API |
| AI/NLU | Google Gemini API |
| Backend | Python Django, DRF |
| Database | SQLite (dev) / PostgreSQL (prod) |

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
| `/api/helper/create-link` | POST | Create family helper link |

### Flight-Engine Integration
Uses [AA Flight-Engine API](https://github.com/AmericanAirlines/Flight-Engine) for realistic mock flight data.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/flights/?date=YYYY-MM-DD` | GET | Get all flights for date |
| `/api/flights/search?origin=DFW&destination=ORD` | GET | Search flights between airports |
| `/api/airports/` | GET | Get all airports |
| `/api/airports/?code=DFW` | GET | Get airport by code |
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
