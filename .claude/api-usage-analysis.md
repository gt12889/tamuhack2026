# API Endpoint Usage Analysis

## Backend Endpoints vs Frontend Usage

| Endpoint | Used by Frontend | Used by Mobile | Notes |
|----------|-----------------|----------------|-------|
| **Conversation** | | | |
| `conversation/start` | YES | NO | Core feature |
| `conversation/message` | YES | NO | Core feature |
| `conversation/<session_id>` | YES | NO | Get session |
| **Reservation** | | | |
| `reservation/lookup` | YES | NO | Core feature |
| `reservation/change` | YES | NO | Core feature |
| `reservation/create` | NO | NO | **DEAD CODE?** |
| **Flights** | | | |
| `flights/` | NO | NO | **DEAD CODE?** |
| `flights/search` | NO | NO | **DEAD CODE?** |
| `flights/alternatives` | YES | NO | Used for flight changes |
| **Airports** | | | |
| `airports/` | NO | NO | **DEAD CODE?** |
| **Voice** | | | |
| `voice/synthesize` | YES | NO | TTS |
| **Helper** | | | |
| `helper/create-link` | YES | NO | Core feature |
| `helper/<link_id>` | YES | NO | Get helper session |
| `helper/<link_id>/suggest` | YES | NO | Send suggestions |
| `helper/<link_id>/actions` | YES | NO | Get actions |
| `helper/<link_id>/actions/change-flight` | YES | NO | Family action |
| `helper/<link_id>/actions/cancel-flight` | YES | NO | Family action |
| `helper/<link_id>/actions/select-seat` | YES | NO | Family action |
| `helper/<link_id>/actions/add-bags` | YES | NO | Family action |
| `helper/<link_id>/actions/request-wheelchair` | YES | NO | Family action |
| `helper/<link_id>/flights` | YES | NO | Flight picker |
| `helper/<link_id>/seats` | YES | NO | Seat picker |
| **Retell** | | | |
| `retell/status` | YES | NO | Check config |
| `retell/agents` | YES | NO | List agents |
| `retell/agents/create` | YES | NO | Create agent |
| `retell/agents/<id>` | YES | NO | Get agent |
| `retell/calls/web` | YES | NO | Web call |
| `retell/calls/phone` | YES | NO | Phone call |
| `retell/calls/<id>` | YES | NO | Get call |
| `retell/calls/<id>/end` | YES | NO | End call |
| `retell/webhook` | N/A | N/A | Called by Retell service |
| `retell/function` | N/A | N/A | Called by Retell service |
| `retell/functions` | NO | NO | Config endpoint |
| **Email** | | | |
| `email/status` | NO | NO | **DEAD CODE?** |
| `email/booking-confirmation` | NO | NO | **DEAD CODE?** (called internally) |
| `email/flight-change` | NO | NO | **DEAD CODE?** (called internally) |
| **Reminders** | | | |
| `reminders/status` | NO | NO | **DEAD CODE?** |
| `reminders/gate-closing` | NO | NO | **DEAD CODE?** |
| `reminders/departure` | NO | NO | **DEAD CODE?** |
| `reminders/manual` | NO | NO | **DEAD CODE?** |
| `reminders/upcoming` | NO | NO | **DEAD CODE?** |
| **Health** | | | |
| `health/` | NO | NO | Used for deployment monitoring |

## Potentially Unused Endpoints (Dead Code Candidates)

### Definitely Unused by Frontend:
1. `reservation/create` - No frontend call
2. `flights/` - General flight list, not used
3. `flights/search` - Search endpoint, not used
4. `airports/` - Airport info, not used
5. `email/status` - Status check, not used
6. `email/booking-confirmation` - May be called internally
7. `email/flight-change` - May be called internally
8. `reminders/*` - All reminder endpoints (5 total)
9. `retell/functions` - Config/docs endpoint

### Notes:
- **Email endpoints**: Called internally by `change_reservation` view, not dead code
- **Retell webhook/function**: Called by Retell service, not frontend
- **Health endpoint**: Used by deployment/monitoring, not dead code
- **Reminder endpoints**: Appear to be for proactive outbound calls feature

## Recommendation

### Keep (Internal/Infrastructure use):
- `health/` - Deployment monitoring
- `retell/webhook`, `retell/function` - External service callbacks
- `email/*` - Called internally by reservation changes

### Review for Removal:
1. `reservation/create` - If not needed for demo
2. `flights/` and `flights/search` - Generic search not used
3. `airports/` - Airport lookup not used
4. `reminders/*` - If outbound reminder feature not demoed

### Consider Adding Frontend Usage:
- `airports/` could enhance flight picker with city names
- `flights/search` could enable new booking feature
