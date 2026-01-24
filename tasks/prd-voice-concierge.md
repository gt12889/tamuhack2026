# PRD: AA Voice Concierge
**TAMUHack 2026** | American Airlines | Gemini | ElevenLabs | Vultr

---

## 🎯 The Pitch

**Problem:** Elderly passengers prefer calling AA's hotline over self-service, straining reservation agents.

**Solution:** Voice-first web assistant that lets seniors change flights through natural conversation—no typing, no navigation, just talk.

**Why It Wins:**
- Solves a REAL AA pain point (elderly hotline calls)
- ElevenLabs is CORE to the UX (not a bolt-on)
- Gemini powers natural conversation (not just commands)
- Emotionally compelling demo (helping grandma)
- Differentiated (no other team doing voice-first)

---

## 🎬 Demo Script (2 minutes)

**"Grandma Changes Her Flight"**

1. Open landing page → Click big "Talk to AA" button
2. **Voice:** "Hi! I'm your American Airlines assistant. What do you need today?"
3. **User:** "I need to change my flight"
4. **Voice:** "What's your confirmation code? You can spell it."
5. **User:** "D-E-M-O-1-2-3"
6. **Voice:** "Got it! You're flying Dallas to Chicago on January 25th. What would you like to change?"
7. **User:** "I need to go on the 26th instead"
8. **Voice:** "I found a flight tomorrow at 2pm. Would you like this one?"
9. **[Big visual shows option with giant "Yes" button]**
10. **User clicks or says:** "Yes"
11. **Voice:** "Perfect! Your new flight is January 26th at 2pm. You're all set!"
12. **[Big green checkmark, confirmation displayed]**

**Demo Code:** `DEMO123`

---

## ✅ MVP Features (Must Have)

### 1. Landing Page
- AA branding, large "Talk to AA" button (200px+)
- Minimal text: "Need help with your flight? Just talk to me."
- High contrast, 24px+ fonts

### 2. Voice Input
- Web Speech API for speech-to-text
- Visual listening indicator (pulsing mic)
- 2-second silence = end of utterance
- Text input fallback

### 3. Voice Output
- ElevenLabs TTS for all responses
- Auto-play audio
- Visual text display (for hearing-impaired)
- Warm, clear voice (Rachel or similar)

### 4. AI Conversation
- Gemini processes user speech
- Understands: change flight, lookup reservation
- Extracts: dates, confirmation codes, cities
- Maintains conversation context
- Elderly-friendly prompts (patient, simple)

### 5. Reservation Lookup
- Handles confirmation codes (spelled or spoken)
- Mock reservation data
- Displays in large, simple format

### 6. Flight Change Flow
- Understands: "I need to fly tomorrow instead"
- Shows 1-2 options with big buttons
- Confirms before finalizing
- Visual confirmation screen

---

## 🎁 Stretch Features (If Time)

### Family Helper Mode
- Generate shareable link (`/help/abc123`)
- Family member can view session and type suggestions
- Voice reads family suggestions to senior

### Conversation Transcript
- Expandable transcript panel
- Shows full conversation history

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TailwindCSS |
| Voice Input | Web Speech API |
| Voice Output | ElevenLabs TTS API |
| AI/NLU | Google Gemini API |
| Backend | Django + DRF |
| Database | PostgreSQL (Vultr) |
| Hosting | Vultr |

---

## 📋 Implementation Checklist

### Phase 1: Voice Foundation
- [ ] Landing page with "Talk to AA" button
- [ ] Web Speech API integration
- [ ] ElevenLabs TTS integration
- [ ] Basic conversation loop

### Phase 2: AI + Booking
- [ ] Gemini API integration
- [ ] Reservation lookup (mock data)
- [ ] Flight change conversation flow
- [ ] Confirmation screen

### Phase 3: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Deploy to Vultr
- [ ] Test demo flow

---

## 🎤 Gemini Prompt Template

```
You are a friendly American Airlines assistant helping elderly passengers change flights.

PERSONALITY:
- Patient and understanding
- Warm and friendly (like a helpful grandchild)
- Clear and simple (avoid jargon, short sentences)
- Reassuring (confirm understanding frequently)

RULES:
1. Ask ONE question at a time
2. Always confirm before making changes
3. Read back important details (dates, times, flight numbers)
4. Keep responses under 3 sentences
5. Use 12-hour time with AM/PM
6. Spell out months (January, not 1/25)

Current reservation: {reservation_details}
Conversation history: {messages}
User just said: "{user_transcript}"

Respond naturally. If you need information, ask. If you can help, do so clearly.
```

---

## 🔊 ElevenLabs Config

- **Voice:** Pre-made professional (Rachel or Josh)
- **Stability:** 0.7
- **Similarity Boost:** 0.8
- **Speaking Rate:** 0.9x (slightly slower)

---

## 📊 Mock Data

**Demo Reservation:**
- Confirmation Code: `DEMO123`
- Passenger: Margaret Johnson
- Flight: DFW → ORD, Jan 25, 2:00 PM
- Alternative: Same route, Jan 26, 2:00 PM

**Additional Test Codes:** `TEST456`, `HELP789`

---

## 🚨 Error Handling

| Error | User Experience |
|-------|----------------|
| Microphone denied | "I need microphone access. Please click Allow, or type your message." |
| No speech detected | "I didn't catch that. Could you repeat?" |
| Gemini timeout | "Give me just a moment..." (retry) |
| ElevenLabs fails | Show text response only |
| Reservation not found | "I couldn't find that. Let's try another way." |

**Fallbacks:**
- Voice fails → Text input always available
- ElevenLabs fails → Browser TTS (Web Speech API)
- Gemini fails → Pre-written responses for common intents

---

## 🎯 Success Metrics

- ✅ Complete flight change via voice in <2 minutes
- ✅ Zero typing required for core flow
- ✅ Voice responses generate in <2 seconds
- ✅ UI readable from 3 feet away
- ✅ Judges can try it themselves with `DEMO123`

---

## 🏆 Track Alignment

### American Airlines
- ✅ Improves passenger experience (elderly accessibility)
- ✅ Reduces operational burden (fewer hotline calls)
- ✅ Innovative solution (voice-first)

### Gemini
- ✅ Natural language conversation (not just Q&A)
- ✅ Multi-turn dialogue with context
- ✅ Elderly-optimized prompt engineering

### ElevenLabs
- ✅ Voice is CORE to UX (entire app is voice-first)
- ✅ Natural speech quality
- ✅ Accessible technology application

### Vultr
- ✅ Deployed on Vultr infrastructure
- ✅ Scalable architecture
- ✅ Publicly accessible demo URL

---

## 📝 API Endpoints

```
POST /api/conversation/start
  → { session_id, greeting, audio_url }

POST /api/conversation/message
  → { reply, audio_url, intent, entities }

GET /api/reservation/lookup?code=DEMO123
  → { reservation }

POST /api/reservation/change
  → { success, new_reservation }

POST /api/voice/synthesize
  → { audio_url }
```

---

## 🎬 Presentation Outline (5 min)

1. **Hook (30s):** "Your grandmother needs to change her flight. Would she rather navigate aa.com... or just say 'I need to fly tomorrow'?"

2. **Problem (45s):** Elderly passengers call hotline instead of using digital channels

3. **Solution (1m):** Voice-first assistant - just talk, no navigation

4. **Live Demo (2m):** Complete flight change via voice

5. **Tech Stack (30s):** ElevenLabs + Gemini + Vultr

6. **Impact (15s):** Reduces hotline calls, serves underserved demographic

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Web Speech API browser issues | Test on Chrome/Edge; show supported browsers |
| Background noise in demo | Have text input ready; practice in quiet area |
| Demo code shared publicly | Have backup codes ready |
| Microphone permissions | Clear explanation + text fallback |

---

## 🚀 Quick Start

1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env  # Add API keys
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local  # Set API URL
   npm run dev
   ```

3. **Test:** Open http://localhost:3000, use code `DEMO123`

---

## 📦 Deployment

See `DEPLOYMENT.md` for Vultr setup instructions.

**Quick Deploy:**
- Vultr Compute Instance (2GB RAM)
- Vultr Managed PostgreSQL
- Docker Compose + Nginx
- Let's Encrypt SSL

---

## ✅ Pre-Demo Checklist

- [ ] Test with `DEMO123` code
- [ ] Verify microphone permissions work
- [ ] Test in quiet environment
- [ ] Have backup demo codes ready
- [ ] Test on judges' devices (Chrome/Edge)
- [ ] Verify ElevenLabs API key has credits
- [ ] Verify Gemini API key is active
- [ ] Deploy to Vultr and test live URL
- [ ] Practice demo script 3x
- [ ] Prepare backup plan if voice fails (text mode)

---

**Last Updated:** Hackathon Ready ✨
