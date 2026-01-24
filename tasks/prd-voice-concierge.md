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

## 🎬 Demo Scripts

### Script 1: Rebooking Existing Flight (2 minutes)

**"Grandma Changes Her Flight"**

1. Open landing page → Click big "Talk to AA" button
2. **Voice:** "Hi! I'm your American Airlines assistant. What do you need today?"
3. **User:** "I need to change my flight"
4. **Voice:** "What's your confirmation code? You can spell it."
5. **User:** "D-E-M-O-1-2-3"
6. **Voice:** "Got it! I see your flight to Dallas on Friday. What would you like to change?"
7. **User:** "I need to go on Saturday instead"
8. **Voice:** "I found a flight on Saturday at 2pm. Same price. Should I switch you?"
9. **[Big visual shows option with giant "Yes" button]**
10. **User clicks or says:** "Yes"
11. **Voice:** "Perfect! Your new flight is Saturday at 2pm. You're all set!"
12. **[Big green checkmark, confirmation displayed]**

**Demo Code:** `DEMO123`

### Script 2: New Booking (3 minutes)

**"Grandma Books a New Flight"**

1. Open landing page → Click "Talk to AA"
2. **Voice:** "Hi! I'm your American Airlines assistant. What do you need today?"
3. **User:** "I want to book a flight"
4. **Voice:** "I'd be happy to help you book a flight. Where are you flying from?"
5. **User:** "Dallas"
6. **Voice:** "Great! Where are you going?"
7. **User:** "Chicago"
8. **Voice:** "When do you want to leave?"
9. **User:** "Next Tuesday"
10. **Voice:** "Is this round trip?"
11. **User:** "No, just one way"
12. **Voice:** "How many travelers?"
13. **User:** "Just me"
14. **Voice:** "I found 3 flights. The earliest leaves at 8am for $249. Want to hear more options?"
15. **User:** "The 8am one sounds good"
16. **Voice:** "Perfect! What's your first name?"
17. **User:** "Margaret"
18. **Voice:** "And your last name?"
19. **User:** "Johnson"
20. **Voice:** "Great! I'm creating your booking. I'll send the confirmation to your family helper link. You're all set!"
21. **[Big green checkmark, confirmation displayed]**

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

### 4. AI Conversation (Gemini)
Gemini handles 4 critical functions:

**A. Intent Detection**
- Figures out what passenger wants:
  - **New booking** (book a flight)
  - **Rebooking** (change existing flight)
  - Change seat
  - Add bags
  - Request wheelchair
  - Check status
  - Lookup reservation

**B. Guided Dialog Flow (Elderly-First)**
- Asks ONE question at a time (not overwhelming)
- Repeats back what it heard (confirmation)
- Keeps conversation on rails (not open-ended chatbot)
- Maintains context across turns

**C. Reservation Change Reasoning**
- Selects best next steps based on mock reservation + constraints
- Generates 1-2 simple options for passenger (not 10+ choices)
- Considers: dates, connections, passenger preferences

**D. Output Formatting for UI**
- Returns structured JSON:
  - `reply`: Assistant message to speak
  - `intent`: Detected intent
  - `entities`: Extracted data (dates, codes, cities)
  - `action`: Next step (lookup, show_options, confirm_change)
- Makes frontend reliable and demo-safe

### 5. Reservation Lookup
- Handles confirmation codes (spelled or spoken)
- Mock reservation data
- Displays in large, simple format

### 6. Flight Change Flow (Rebooking)
- Understands: "I need to fly tomorrow instead"
- Shows 1-2 options with big buttons
- Confirms before finalizing
- Visual confirmation screen

### 7. New Booking Flow
- Guided conversation to book new flights:
  1. "Where are you flying from?"
  2. "Where are you going?"
  3. "When do you want to leave?" (flexible: "next Tuesday", "January 15th")
  4. "Is this round trip?" → if yes: "When do you want to return?"
  5. "How many travelers?" → "Any children under 12?"
  6. Shows 1-3 flight options: "I found 3 flights. The earliest leaves at 8am for $249. Want to hear more options?"
  7. Confirm & collect name (first, last)
  8. Skip email - send confirmation to family helper link instead

### 8. Rebooking Flow
- For existing reservations:
  1. "I see your flight to Dallas on Friday. What would you like to change?"
  2. Listen for: date, time, or destination
  3. "I found a flight on Saturday at 2pm. Same price. Should I switch you?"
  4. Confirm change

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
- [ ] Rebooking conversation flow (change existing flight)
- [ ] New booking conversation flow (book new flight)
- [ ] Confirmation screen

### Phase 3: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Deploy to Vultr
- [ ] Test demo flow

---

## 🎤 Gemini Integration

### 4 Main Functions

**1. Intent Detection**
- Detects: **new_booking**, **rebooking** (change_flight), change_seat, add_bags, request_wheelchair, check_status, lookup_reservation
- Returns structured intent classification

**2. Guided Dialog Flow (Elderly-First)**
- Asks ONE question at a time
- Repeats back what it heard: "So you want to fly on the 26th instead?"
- Keeps conversation on rails (not open-ended chatbot)
- Maintains context across turns

**3. Reservation Change Reasoning**
- Analyzes mock reservation + passenger constraints
- Generates 1-2 simple options (not overwhelming)
- Considers: dates, connections, preferences

**4. Output Formatting for UI**
- Returns structured JSON:
```json
{
  "reply": "I found a flight tomorrow at 2pm. Would you like this one?",
  "intent": "change_flight",
  "entities": {
    "date": "2026-01-26",
    "confirmation_code": "DEMO123"
  },
  "action": "show_options"
}
```
- Makes frontend reliable and demo-safe

### Prompt Template

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

IMPORTANT: Return valid JSON only with:
- reply: conversational response
- intent: detected intent
- entities: extracted data
- action: next step (lookup, show_options, confirm_change, complete)

Current reservation: {reservation_details}
Conversation history: {messages}
User just said: "{user_transcript}"

Respond with JSON only.
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
- ✅ **Intent Detection**: Identifies passenger needs (change flight, seat, bags, wheelchair)
- ✅ **Guided Dialog Flow**: One question at a time, repeats back, keeps conversation on rails
- ✅ **Reservation Reasoning**: Selects best options based on constraints (1-2 options)
- ✅ **Output Formatting**: Structured JSON for reliable frontend integration
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
  → { reply, audio_url, intent, entities, action }

GET /api/reservation/lookup?code=DEMO123
  → { reservation }

POST /api/reservation/change
  → { success, new_reservation }

POST /api/reservation/create
  → { success, reservation, confirmation_code }

POST /api/voice/synthesize
  → { audio_url }
```

## 🔄 Conversation Flows

### New Booking Flow

**Step-by-step conversation:**

1. **Origin:** "Where are you flying from?"
   - User: "Dallas" or "DFW"
   - Extract: `origin: "DFW"`

2. **Destination:** "Where are you going?"
   - User: "Chicago" or "ORD"
   - Extract: `destination: "ORD"`

3. **Departure Date:** "When do you want to leave?"
   - User: "next Tuesday" or "January 15th" or "tomorrow"
   - Extract: `date: "2026-01-28"` (normalized)

4. **Trip Type:** "Is this round trip?"
   - User: "Yes" or "No"
   - Extract: `round_trip: true/false`
   - If yes → Ask: "When do you want to return?"
   - Extract: `return_date: "2026-02-05"`

5. **Travelers:** "How many travelers?"
   - User: "Just me" or "Two of us"
   - Extract: `travelers: 1` or `travelers: 2`
   - If >1: "Any children under 12?"
   - Extract: `children: 0`

6. **Show Options:** 
   - Search flights with criteria
   - "I found 3 flights. The earliest leaves at 8am for $249. Want to hear more options?"
   - Action: `show_options`
   - Display 1-3 options with big buttons

7. **Collect Name:**
   - "What's your first name?" → Extract: `first_name: "Margaret"`
   - "And your last name?" → Extract: `last_name: "Johnson"`

8. **Confirm:**
   - "Perfect! I'm creating your booking. I'll send the confirmation to your family helper link."
   - Action: `confirm_booking`
   - Create reservation, generate helper link

### Rebooking Flow

**Step-by-step conversation:**

1. **Lookup:** User provides confirmation code
   - Extract: `confirmation_code: "DEMO123"`
   - Action: `lookup`
   - Load existing reservation

2. **Identify Change:**
   - "I see your flight to Dallas on Friday. What would you like to change?"
   - Listen for: date, time, destination
   - Extract: `date: "2026-01-26"` or `time: "afternoon"` or `destination: "Miami"`

3. **Find Alternatives:**
   - Search for alternative flights
   - "I found a flight on Saturday at 2pm. Same price. Should I switch you?"
   - Action: `show_options`
   - Display 1-2 options

4. **Confirm:**
   - User: "Yes" or clicks button
   - Action: `confirm_change`
   - Update reservation
   - "Perfect! Your new flight is Saturday at 2pm. You're all set!"

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
