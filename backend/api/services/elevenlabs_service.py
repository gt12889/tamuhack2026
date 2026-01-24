"""ElevenLabs TTS service for voice synthesis."""

import logging
import hashlib
import os
from typing import Optional
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class ElevenLabsService:
    """Service for ElevenLabs text-to-speech."""

    API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.voice_id_en = settings.ELEVENLABS_VOICE_ID
        self.voice_id_es = settings.ELEVENLABS_VOICE_ID_ES

    def synthesize(
        self,
        text: str,
        language: str = 'en',
        cache_audio: bool = True
    ) -> Optional[dict]:
        """
        Convert text to speech using ElevenLabs API.

        Args:
            text: Text to convert to speech
            language: 'en' for English, 'es' for Spanish
            cache_audio: Whether to cache the audio response

        Returns:
            Dict with audio_url and duration_ms, or None on failure
        """
        if not self.api_key:
            logger.warning("ElevenLabs API key not configured, using fallback")
            return self._fallback_response(text)

        # Check cache first
        cache_key = self._get_cache_key(text, language)
        if cache_audio:
            cached = cache.get(cache_key)
            if cached:
                return cached

        voice_id = self.voice_id_es if language == 'es' else self.voice_id_en

        try:
            import httpx

            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key,
            }

            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.7,
                    "similarity_boost": 0.8,
                    "style": 0.0,
                    "use_speaker_boost": True,
                }
            }

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.API_URL}/{voice_id}",
                    json=data,
                    headers=headers,
                )

                if response.status_code == 200:
                    # For hackathon demo, we'll return a data URL
                    # In production, you'd upload to S3/GCS and return a URL
                    import base64
                    audio_data = base64.b64encode(response.content).decode('utf-8')
                    audio_url = f"data:audio/mpeg;base64,{audio_data}"

                    # Estimate duration (rough: ~150 words per minute)
                    word_count = len(text.split())
                    duration_ms = int((word_count / 150) * 60 * 1000)

                    result = {
                        "audio_url": audio_url,
                        "duration_ms": max(duration_ms, 1000),
                    }

                    if cache_audio:
                        cache.set(cache_key, result, timeout=900)  # 15 min cache

                    return result
                else:
                    logger.error(f"ElevenLabs API error: {response.status_code}")
                    return self._fallback_response(text)

        except Exception as e:
            logger.error(f"ElevenLabs synthesis error: {e}")
            return self._fallback_response(text)

    def _get_cache_key(self, text: str, language: str) -> str:
        """Generate cache key for audio."""
        text_hash = hashlib.md5(text.encode()).hexdigest()[:12]
        return f"elevenlabs:{language}:{text_hash}"

    def _fallback_response(self, text: str) -> dict:
        """
        Return fallback response when ElevenLabs is unavailable.
        Frontend will use browser TTS as backup.
        """
        word_count = len(text.split())
        duration_ms = int((word_count / 150) * 60 * 1000)

        return {
            "audio_url": None,  # Frontend will use browser TTS
            "duration_ms": max(duration_ms, 1000),
            "fallback": True,
            "text": text,  # Pass text for browser TTS
        }


# Pre-defined responses for common phrases (to reduce API calls)
CACHED_PHRASES = {
    "greeting": "Hi! I'm your American Airlines assistant. I'm here to help with your trip. What do you need today?",
    "ask_confirmation_code": "I'd be happy to help you change your flight. What's your confirmation code? You can spell it out letter by letter.",
    "code_not_found": "I couldn't find a reservation with that code. Could you please check and try again?",
    "change_confirmed": "Perfect! You're all set. Your new flight has been booked. I'm sending the details to your email. Is there anything else I can help with?",
    "goodbye": "You're welcome! Have a wonderful trip. Goodbye!",
}
