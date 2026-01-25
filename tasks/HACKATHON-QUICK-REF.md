# Hackathon Quick Reference

## Demo Flows

### Flow 1: Rebooking (2 minutes)
1. Open app -> Click "Talk to AA" or call +1 (877) 211-0332
2. Say: "I need to change my flight"
3. Say: "MEEMAW" (voice-friendly confirmation code)
4. Say: "I need to go on Saturday instead"
5. Click "Yes" or say "Yes"
6. Confirmation shown

**Demo Codes (Voice-Friendly):**
| Code | Passenger | Route | Notes |
|------|-----------|-------|-------|
| MEEMAW | Margaret Johnson | DFW -> ORD | English, standard |
| GRANNY | Maria Garcia | MIA -> SJU | Spanish, IROP delay |
| PAPA44 | Robert Smith | LAX -> JFK -> MIA | Multi-segment |
| NANA55 | Eleanor Williams | ORD -> PHX | Family booking |

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

### Flow 3: Family Helper (Caregiver)
1. Start conversation as passenger
2. Click "Share with Family"
3. Open link in new tab/phone
4. View live transcript + passenger info
5. Use action buttons: Change Flight, Add Bags, Request Wheelchair
6. Send text suggestions (read aloud to passenger)

---

## API Keys Needed

- `GEMINI_API_KEY` - Google Gemini API
- `ELEVENLABS_API_KEY` - ElevenLabs TTS + Conversational AI
- `ELEVENLABS_AGENT_ID` - ElevenLabs Agent ID
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

# HTTPS Tunnel (for ElevenLabs webhooks)
cloudflared tunnel --url http://localhost:8001
```

---

## Test Endpoints

- Frontend: http://localhost:3000
- Backend: http://localhost:8001
- Health: http://localhost:8001/api/health/
- ElevenLabs Status: http://localhost:8001/api/elevenlabs/convai/status

---

## Caregiver Actions Available

| Action | Description |
|--------|-------------|
| Change Flight | Rebook to alternative flight |
| Cancel Flight | Cancel the reservation |
| Select Seat | Choose preferred seat |
| Add Bags | Add checked baggage |
| Request Wheelchair | Request wheelchair assistance |
| Accept Rebooking | Accept IROP rebooking |
| Send Suggestion | Text read aloud to passenger |

---

## IROP (Disruption) Handling

The system handles:
- **Delays** - Shows updated times, offers rebooking
- **Cancellations** - Presents rebooking options
- **Missed Connections** - Analyzes risk, offers alternatives

Caregiver can accept/decline rebookings remotely.

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
| Can't find reservation | Use voice-friendly codes: MEEMAW, GRANNY, PAPA44, NANA55 |
| Webhook not receiving | Need HTTPS tunnel (cloudflared) |

---

## Presentation Points

1. **Problem:** Elderly passengers struggle with apps and phone menus
2. **Solution:** Voice-first assistant with natural conversation
3. **Demo:** Live flight change + family helper with FULL action capabilities
4. **Tech:** Gemini + ElevenLabs Conversational AI + Vultr
5. **Impact:** Reduces calls, serves underserved demographic
6. **Bonus:** Caregiver can remotely help during disruptions (delays, cancellations)

---

**Keep this open during the hackathon!**
