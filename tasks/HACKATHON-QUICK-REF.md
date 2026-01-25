# Hackathon Quick Reference

## Demo Flows

### Flow 1: Rebooking (2 minutes)
1. Open app -> Click "Talk to AA"
2. Say: "I need to change my flight"
3. Say: "D-E-M-O-1-2-3" (spell confirmation code)
4. Say: "I need to go on Saturday instead"
5. Click "Yes" or say "Yes"
6. Confirmation shown

**Demo Code:** `DEMO123`

### Flow 2: New Booking (3 minutes)
1. Open app -> Click "Talk to AA"
2. Say: "I want to book a flight"
3. Say: "Dallas" (origin)
4. Say: "Chicago" (destination)
5. Say: "Next Tuesday" (date)
6. Say: "No" (round trip)
7. Say: "Just me" (travelers)
8. Select flight option
9. Say: "Margaret" (first name)
10. Say: "Johnson" (last name)
11. Confirmation shown

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
python manage.py runserver 0.0.0.0:8001

# Frontend
cd frontend
npm run dev

# Docker
docker-compose up
```

---

## Test Endpoints

- Frontend: http://localhost:3000
- Backend: http://localhost:8001
- Health: http://localhost:8001/api/health/

---

## Mock Data

**DEMO123:**
- Margaret Johnson
- DFW -> ORD, Jan 25, 2:00 PM
- Alternative: Jan 26, 2:00 PM

**TEST456:**
- Robert Smith
- LAX -> JFK -> MIA

**ABUELA1:**
- Maria Garcia (Spanish)
- MIA -> SJU

---

## Gemini Intents

- `new_booking` - Book a new flight
- `rebooking` - Change existing flight
- `change_flight` - Alias for rebooking
- `lookup_reservation` - Find existing booking
- `check_status` - Check flight status
- `family_help` - Request family assistance

---

## Common Issues

| Problem | Fix |
|---------|-----|
| Mic not working | Check browser permissions, use text input |
| No audio | Check ElevenLabs API key, use browser TTS fallback |
| Gemini timeout | Retry once, show "thinking" animation |
| Can't find reservation | Check code spelling, try backup codes |

---

## Presentation Points

1. **Problem:** Elderly passengers struggle with apps and phone menus
2. **Solution:** Voice-first assistant with natural conversation
3. **Demo:** Live flight change + family helper
4. **Tech:** Gemini + ElevenLabs + Retell + Vultr
5. **Impact:** Reduces calls, serves underserved demographic

---

**Keep this open during the hackathon!**
