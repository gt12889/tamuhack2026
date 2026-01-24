# 🚀 Hackathon Quick Reference

## Demo Flow (2 minutes)

1. Open app → Click "Talk to AA"
2. Say: "I need to change my flight"
3. Say: "D-E-M-O-1-2-3" (spell confirmation code)
4. Say: "I need to go on the 26th instead"
5. Click "Yes" or say "Yes"
6. ✅ Confirmation shown

**Demo Code:** `DEMO123`

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

## Gemini Prompt (Copy-Paste)

```
You are a friendly American Airlines assistant helping elderly passengers change flights.

Be patient, warm, and clear. Ask ONE question at a time. Always confirm before making changes.

Current reservation: {reservation}
User said: "{transcript}"

Respond naturally and helpfully.
```

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
