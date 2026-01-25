# ElevenLabs Conversational AI Agent Setup Guide

This guide explains how to configure your ElevenLabs Conversational AI agent with American Airlines knowledge and airport maps.

## Step 1: Get the Agent Prompt

The agent prompt includes:
- American Airlines company information and policies
- Airport layouts, terminals, gates, and navigation for major hubs
- Flight information and booking procedures
- Airport code mappings

To get the prompt, run:

```bash
cd backend
python manage.py shell
```

Then in the Python shell:
```python
from api.services.elevenlabs_agent_prompt import print_elevenlabs_prompt
print_elevenlabs_prompt()
```

Or import and use it programmatically:
```python
from api.services.elevenlabs_agent_prompt import get_elevenlabs_agent_prompt
prompt = get_elevenlabs_agent_prompt()
print(prompt)
```

## Step 2: Configure Agent in ElevenLabs Dashboard

1. Go to https://elevenlabs.io/app/conversational-ai
2. Create a new agent or edit an existing one
3. In the "General Prompt" field, paste the prompt from Step 1
4. Configure the following settings:
   - **Voice**: Use a clear, friendly voice (Rachel recommended for English)
   - **ASR Model**: **Scribe Realtime** (required for better user speech recognition)
   - **Language**: **English** (explicitly set - implicit language detection doesn't work with Scribe Realtime)
   - **Response Style**: Conversational, patient, elderly-friendly
   - **User Transcript Forwarding**: **Enable** (if available in agent settings - this allows user speech to appear in the live transcript)

**Important**: 
- When using Scribe Realtime ASR, you must explicitly set the language. The backend will pass the language parameter when creating web calls.
- Make sure the agent is configured to use Scribe Realtime in the ElevenLabs dashboard.
- **For Live Transcript**: If your agent settings have an option to "Forward User Transcripts" or "Enable User Speech Transcription", make sure it's enabled. This allows user speech to appear in the `onMessage` callback during web calls.

## Step 3: Configure Server Tools

Your backend provides server tools that the agent can call. Configure these in the ElevenLabs dashboard:

**Server Tools Endpoint**: `https://your-domain.com/api/elevenlabs/server-tool`

Available tools:
- `lookup_reservation` - Find reservation by confirmation code
- `change_flight` - Change flight date/time
- `create_booking` - Create new booking
- `get_flight_options` - Search available flights
- `get_reservation_status` - Check reservation status
- `get_directions` - Get directions to airport amenities
- `create_family_helper_link` - Create family helper link
- `check_flight_delays` - Check for delays/cancellations
- `get_gate_directions` - Get directions to specific gate
- `request_wheelchair` - Request wheelchair assistance
- `add_bags` - Add checked bags

## Step 4: Set Agent ID in Environment

After creating the agent, copy the Agent ID from the ElevenLabs dashboard and add it to your `.env` file:

```bash
ELEVENLABS_MAIN_AGENT_ID=your_agent_id_here
```

Or use the legacy variable name:
```bash
ELEVENLABS_AGENT_ID=your_agent_id_here
```

## Knowledge Included

The agent prompt includes:

### American Airlines Information
- Company history and hub airports
- Key policies (check-in, baggage, seating, changes, cancellations)
- Common services (wheelchadeir assistance, unaccompanied minors, special meals)
- AAdvantage program basics

### Airport Knowledge
- **DFW (Dallas/Fort Worth)**: 5 terminals (A-E), Skylink train system
- **ORD (Chicago O'Hare)**: 4 terminals, ATS transit system
- **MIA (Miami)**: Concourses D and E, Latin America gateway
- **LAX (Los Angeles)**: Terminals 4 and 5
- **CLT (Charlotte)**: Concourses A-E
- **PHL (Philadelphia)**: Multiple terminals, Terminal A-West main
- **PHX (Phoenix)**: Terminals 3 and 4
- Plus navigation tips and gate information

### Airport Code Mappings
- City names to airport codes (Dallas → DFW, Chicago → ORD, etc.)
- Common airport code references

### Flight Information
- Flight number formats (AA####)
- Confirmation code formats
- Seat assignment information
- Gate assignment procedures

## Testing

After configuration, test the agent by:
1. Starting a web call from your frontend
2. Asking questions like:
   - "How do I get to Gate B22 at DFW?"
   - "What are American Airlines baggage policies?"
   - "Tell me about DFW airport terminals"
   - "What's the confirmation code format?"

The agent should use the knowledge base to provide accurate, helpful answers.
critic