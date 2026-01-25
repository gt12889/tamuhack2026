# API Endpoint Usage Analysis

## Backend Endpoints vs Frontend Usage

| Endpoint | Used by Frontend | Notes |
|----------|-----------------|-------|
| **Conversation** | | |
| `conversation/start` | YES | Core feature |
| `conversation/message` | YES | Core feature |
| `conversation/<session_id>` | YES | Get session |
| **Reservation** | | |
| `reservation/lookup` | YES | Core feature |
| `reservation/change` | YES | Core feature |
| `reservation/create` | NO | Used by voice tools |
| **Flights** | | |
| `flights/` | NO | Used internally |
| `flights/search` | NO | Used by voice tools |
| `flights/alternatives` | YES | Used for flight changes |
| **Airports** | | |
| `airports/` | NO | Used internally |
| **Voice** | | |
| `voice/synthesize` | YES | TTS |
| **Helper** | | |
| `helper/create-link` | YES | Core feature |
| `helper/create-area-mapping-link` | YES | Location mode |
| `helper/<link_id>` | YES | Get helper session |
| `helper/<link_id>/suggest` | YES | Send suggestions |
| `helper/<link_id>/actions` | YES | Get actions |
| `helper/<link_id>/actions/change-flight` | YES | Family action |
| `helper/<link_id>/actions/cancel-flight` | YES | Family action |
| `helper/<link_id>/actions/select-seat` | YES | Family action |
| `helper/<link_id>/actions/add-bags` | YES | Family action |
| `helper/<link_id>/actions/request-wheelchair` | YES | Family action |
| `helper/<link_id>/flights` | YES | Flight picker |
| `helper/<link_id>/seats` | YES | Seat picker |
| **IROP** | | |
| `helper/<link_id>/irop-status` | YES | Disruption status |
| `helper/<link_id>/actions/accept-rebooking` | YES | Accept IROP rebooking |
| `helper/<link_id>/actions/acknowledge-disruption` | YES | Acknowledge alert |
| **Location** | | |
| `location/update` | YES | Update GPS |
| `location/alert` | YES | Trigger alert |
| `location/<session_id>/history` | YES | Location history |
| `location/<session_id>/alerts` | YES | Get alerts |
| `location/alerts/<id>/acknowledge` | YES | Acknowledge alert |
| `helper/<link_id>/location` | YES | Caregiver location view |
| **ElevenLabs** | | |
| `elevenlabs/convai/status` | YES | Check config |
| `elevenlabs/convai/web-call` | YES | Get signed URL |
| `elevenlabs/convai/webhook` | N/A | Called by ElevenLabs |
| `elevenlabs/convai/tools` | NO | Config endpoint |
| **Reminders** | | |
| `reminders/status` | NO | Outbound calls |
| `reminders/gate-closing` | NO | Proactive alerts |
| `reminders/departure` | NO | Proactive alerts |
| `reminders/manual` | NO | Manual trigger |
| `reminders/upcoming` | NO | List upcoming |
| **Health** | | |
| `health/` | NO | Deployment monitoring |

## Voice Agent Server Tools (11 total)

These tools are called by ElevenLabs Conversational AI via webhook:

| Tool | Purpose |
|------|---------|
| `lookup_reservation` | Find by confirmation code |
| `change_flight` | Reschedule to new date |
| `create_booking` | Book new flight |
| `get_flight_options` | Search available flights |
| `get_reservation_status` | Check booking status |
| `create_family_helper_link` | Generate helper link |
| `check_flight_delays` | Check for disruptions |
| `get_gate_directions` | Get directions to gate |
| `request_wheelchair` | Request wheelchair assistance |
| `add_bags` | Add checked baggage |
| `get_irop_rebooking_options` | Get IROP rebooking options |

## Notes

- **ElevenLabs webhook**: Called by ElevenLabs service, not frontend
- **Health endpoint**: Used by deployment/monitoring
- **Reminder endpoints**: For proactive outbound calls feature
- **Retell endpoints**: DEPRECATED - migrated to ElevenLabs
