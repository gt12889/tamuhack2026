# PRD: ElevenLabs Voice Integration

## Introduction

Complete the ElevenLabs text-to-speech integration to provide natural, high-quality voice responses in the AA Voice Concierge application. The backend service exists but needs the API key configured and the full audio pipeline tested end-to-end. This enables elderly and accessibility-focused users to hear AI responses spoken naturally.

## Goals

- Configure ElevenLabs API key in environment settings
- Ensure audio responses are generated and returned from API endpoints
- Verify frontend correctly plays ElevenLabs audio responses
- Add browser TTS fallback when ElevenLabs is unavailable
- Support both English and Spanish voice synthesis

## User Stories

### US-001: Configure ElevenLabs API key in backend
**Description:** As a developer, I need to add the ElevenLabs API key to the environment so the service can authenticate with the API.

**Acceptance Criteria:**
- [ ] Add ELEVENLABS_API_KEY to backend/.env file with value: sk_3b814dcfe55f6bf0cad92f17460c95e6e3793d4fd49b356f
- [ ] Verify settings.py correctly reads ELEVENLABS_API_KEY from environment
- [ ] Backend server starts without ElevenLabs-related errors
- [ ] Typecheck/lint passes

### US-002: Test ElevenLabs synthesis endpoint
**Description:** As a developer, I need to verify the /api/synthesize/ endpoint returns valid audio data.

**Acceptance Criteria:**
- [ ] POST to /api/synthesize/ with {"text": "Hello, testing"} returns audio_url
- [ ] audio_url contains valid base64-encoded MP3 data (data:audio/mpeg;base64,...)
- [ ] Response includes duration_ms estimate
- [ ] Error responses return fallback with text for browser TTS

### US-003: Verify conversation flow returns audio
**Description:** As a user, I want to hear the assistant's responses spoken aloud when I start a conversation.

**Acceptance Criteria:**
- [ ] POST to /api/conversation/start/ returns audio_url in response
- [ ] POST to /api/conversation/message/ returns audio_url with reply
- [ ] Audio URLs are playable in browser
- [ ] Verify in browser: greeting plays when clicking "Start" button

### US-004: Implement browser TTS fallback in frontend
**Description:** As a user, I want to hear responses even when ElevenLabs is unavailable, using my browser's built-in speech.

**Acceptance Criteria:**
- [ ] When audio_url is null and fallback=true, use Web Speech API
- [ ] Create useBrowserTTS hook with speak(text) function
- [ ] Fallback triggers automatically when ElevenLabs response has fallback: true
- [ ] Fallback voice speaks at appropriate speed for elderly users
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Add audio loading state to UI
**Description:** As a user, I want visual feedback while audio is loading so I know to wait.

**Acceptance Criteria:**
- [ ] VoiceButton shows "loading" animation while audio is being fetched
- [ ] MessageDisplay shows speaker icon when assistant message has audio
- [ ] User cannot interrupt while audio is playing (button shows "speaking" state)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Cache frequently used phrases
**Description:** As a developer, I want common phrases pre-cached to reduce API latency and costs.

**Acceptance Criteria:**
- [ ] Greeting phrase audio is cached on first synthesis
- [ ] CACHED_PHRASES dict in elevenlabs_service.py lists common phrases
- [ ] Cache TTL is 15 minutes (existing implementation)
- [ ] Cached responses return instantly without API call

## Functional Requirements

- FR-1: Backend must read ELEVENLABS_API_KEY from environment variable
- FR-2: ElevenLabsService.synthesize() must return {audio_url, duration_ms} on success
- FR-3: ElevenLabsService must return fallback response with text when API fails
- FR-4: All assistant messages must include audio_url or fallback data
- FR-5: Frontend useAudioPlayer must handle base64 data URLs
- FR-6: Frontend must implement browser TTS when audio_url is null
- FR-7: Voice settings: stability=0.7, similarity_boost=0.8 (professional airline voice)

## Non-Goals

- No voice cloning or custom voice training
- No real-time streaming audio (batch synthesis only)
- No audio file storage (base64 inline only for hackathon)
- No multi-language detection (user must specify language)

## Technical Considerations

- ElevenLabs API model: eleven_monolingual_v1 (fast, good quality)
- Default voice ID: EXAVITQu4vr4xnSDxMaL (Rachel - professional female)
- Spanish voice ID: ErXwobaYiN019PkySvjV
- Audio format: MP3 (mpeg) for broad browser compatibility
- Cache uses Django's default cache backend
- Timeout: 30 seconds for API calls
- Base64 encoding adds ~33% overhead but simplifies delivery

## Success Metrics

- Greeting audio plays within 2 seconds of clicking start
- 95% of responses include playable audio
- Fallback TTS activates within 500ms when ElevenLabs fails
- No user-facing errors related to audio playback

## Open Questions

- Should we add a mute button for users who prefer text-only?
- Should audio auto-play or require user interaction (mobile browsers may require tap)?
