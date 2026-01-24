# 🚀 Hackathon Quick Reference

## Demo Flows

### Flow 1: Rebooking (2 minutes)
1. Open app → Click "Talk to AA"
2. Say: "I need to change my flight"
3. Say: "D-E-M-O-1-2-3" (spell confirmation code)
4. Say: "I need to go on Saturday instead"
5. Click "Yes" or say "Yes"
6. ✅ Confirmation shown

**Demo Code:** `DEMO123`

### Flow 2: New Booking (3 minutes)
1. Open app → Click "Talk to AA"
2. Say: "I want to book a flight"
3. Say: "Dallas" (origin)
4. Say: "Chicago" (destination)
5. Say: "Next Tuesday" (date)
6. Say: "No" (round trip)
7. Say: "Just me" (travelers)
8. Select flight option
9. Say: "Margaret" (first name)
10. Say: "Johnson" (last name)
11. ✅ Confirmation shown

---

## API Keys Needed

- `GEMINI_API_KEY` - Google Gemini API
- `ELEVENLABS_API_KEY` - ElevenLabs TTS
- `DJANGO_SECRET_KEY` - Generate with: `openssl rand -hex 32`

---

## Quick Commands

```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd frontend
npm run dev

# Docker
docker-compose up

# Deploy
./deploy.sh
```

---

## Test Endpoints

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Health: http://localhost:8000/api/health/

---

## Mock Data

**DEMO123:**
- Margaret Johnson
- DFW → ORD, Jan 25, 2:00 PM
- Alternative: Jan 26, 2:00 PM

**TEST456:**
- Robert Smith
- LAX → JFK → MIA

---

## Gemini Intents

- `new_booking` - Book a new flight
- `rebooking` - Change existing flight
- `change_flight` - Alias for rebooking
- `lookup_reservation` - Find existing booking
- `check_status` - Check flight status

## Booking Flow Steps

**New Booking:**
1. Ask origin → 2. Ask destination → 3. Ask date → 4. Ask round trip → 5. Ask travelers → 6. Show options → 7. Collect name → 8. Confirm

**Rebooking:**
1. Lookup reservation → 2. Identify change → 3. Show alternatives → 4. Confirm

---

## ElevenLabs Settings

- Voice ID: `EXAVITQu4vr4xnSDxMaL` (Rachel)
- Stability: 0.7
- Similarity: 0.8
- Rate: 0.9x

---

## Common Issues

| Problem | Fix |
|---------|-----|
| Mic not working | Check browser permissions, use text input |
| No audio | Check ElevenLabs API key, use browser TTS fallback |
| Gemini timeout | Retry once, show "thinking" animation |
| Can't find reservation | Check code spelling, try backup codes |

---

## Must-Have Features

- [x] Landing page
- [x] Voice input (Web Speech API)
- [x] Voice output (ElevenLabs)
- [x] Gemini conversation
- [x] Reservation lookup
- [x] Flight change flow
- [x] Confirmation screen

---

## Stretch (If Time)

- [ ] Family helper link
- [ ] Conversation transcript
- [ ] Spanish language

---

## Presentation Points

1. **Problem:** Elderly passengers call hotline
2. **Solution:** Voice-first assistant
3. **Demo:** Live flight change
4. **Tech:** ElevenLabs + Gemini + Vultr
5. **Impact:** Reduces calls, serves underserved

---

## Emergency Contacts

- Gemini API Docs: https://ai.google.dev/docs
- ElevenLabs Docs: https://elevenlabs.io/docs
- Vultr Support: https://www.vultr.com/support/

---

**Keep this open during the hackathon!** 📌
