"""ElevenLabs TTS service for voice synthesis and outbound calls."""

import logging
import hashlib
import os
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class ElevenLabsService:
    """Service for ElevenLabs text-to-speech and Conversational AI."""

    API_URL = "https://api.elevenlabs.io/v1/text-to-speech"
    CONV_AI_URL = "https://api.elevenlabs.io/v1/convai"

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.voice_id_en = settings.ELEVENLABS_VOICE_ID
        self.voice_id_es = settings.ELEVENLABS_VOICE_ID_ES
        # Conversational AI agent IDs (set in settings or Retell dashboard)
        self.agent_id = getattr(settings, 'ELEVENLABS_AGENT_ID', None)
        self.reminder_agent_id = getattr(settings, 'ELEVENLABS_REMINDER_AGENT_ID', None)

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
                "model_id": "eleven_turbo_v2_5",
                "voice_settings": {
                    "stability": 0.7,
                    "similarity_boost": 0.8,
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
                    logger.error(f"ElevenLabs API error: {response.status_code} - {response.text}")
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


    # ==================== Conversational AI / Outbound Calls ====================

    def create_outbound_call(
        self,
        agent_id: str,
        phone_number: str,
        first_message: Optional[str] = None,
        dynamic_variables: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create an outbound call using ElevenLabs Conversational AI via Twilio.

        Requires:
        - ElevenLabs Conversational AI agent configured
        - Twilio phone number connected in ElevenLabs dashboard

        Args:
            agent_id: ElevenLabs Conversational AI agent ID
            phone_number: Phone number to call (E.164 format)
            first_message: Optional custom first message for the agent
            dynamic_variables: Variables to pass to the agent prompt

        Returns:
            Call details or None on failure
        """
        if not self.api_key:
            logger.warning("ElevenLabs API key not configured")
            return None

        try:
            import httpx

            headers = {
                "xi-api-key": self.api_key,
                "Content-Type": "application/json",
            }

            data = {
                "agent_id": agent_id,
                "phone_number": phone_number,
            }

            if first_message:
                data["first_message"] = first_message

            if dynamic_variables:
                data["dynamic_variables"] = dynamic_variables

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.CONV_AI_URL}/twilio/outbound-call",
                    json=data,
                    headers=headers,
                )

                if response.status_code in [200, 201]:
                    result = response.json()
                    logger.info(f"ElevenLabs outbound call initiated to {phone_number}")
                    return result
                else:
                    logger.error(f"ElevenLabs outbound call error: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"ElevenLabs outbound call error: {e}")
            return None

    def create_reminder_call(
        self,
        phone_number: str,
        passenger_name: str,
        flight_info: Dict[str, Any],
        reminder_type: str = 'gate_closing',
        language: str = 'en',
    ) -> Optional[Dict[str, Any]]:
        """
        Create an outbound reminder call for flight notifications.

        Args:
            phone_number: Phone number to call (E.164 format)
            passenger_name: Passenger's name
            flight_info: Dict with flight_number, gate, departure_time, etc.
            reminder_type: 'gate_closing', 'departure_1hr', 'final_boarding'
            language: 'en' or 'es'

        Returns:
            Call details or None on failure
        """
        agent_id = self.reminder_agent_id or self.agent_id
        if not agent_id:
            logger.error("No ElevenLabs agent ID configured for reminder calls")
            return None

        # Build dynamic variables for the agent
        dynamic_variables = {
            "passenger_name": passenger_name,
            "flight_number": flight_info.get('flight_number', ''),
            "gate": flight_info.get('gate', 'please check the departure board'),
            "departure_time": flight_info.get('departure_time', ''),
            "origin": flight_info.get('origin', ''),
            "destination": flight_info.get('destination', ''),
            "seat": flight_info.get('seat', ''),
            "reminder_type": reminder_type,
            "language": language,
        }

        # Build first message based on reminder type and language
        if language == 'es':
            first_messages = {
                'gate_closing': f"Hola {passenger_name}, le llamo de American Airlines. Su vuelo {flight_info.get('flight_number')} está abordando en la puerta {flight_info.get('gate', 'indicada en el tablero')}. Por favor diríjase a la puerta inmediatamente.",
                'departure_1hr': f"Hola {passenger_name}, este es un recordatorio de American Airlines. Su vuelo {flight_info.get('flight_number')} sale en aproximadamente una hora desde la puerta {flight_info.get('gate', 'indicada en el tablero')}.",
                'final_boarding': f"Llamada final para {passenger_name}. Su vuelo {flight_info.get('flight_number')} está cerrando las puertas. Por favor preséntese inmediatamente en la puerta {flight_info.get('gate', 'de embarque')}.",
            }
        else:
            first_messages = {
                'gate_closing': f"Hello {passenger_name}, this is American Airlines calling. Your flight {flight_info.get('flight_number')} is now boarding at gate {flight_info.get('gate', 'shown on the departure board')}. Please proceed to the gate immediately.",
                'departure_1hr': f"Hello {passenger_name}, this is a reminder from American Airlines. Your flight {flight_info.get('flight_number')} departs in approximately one hour from gate {flight_info.get('gate', 'shown on the departure board')}.",
                'final_boarding': f"Final call for {passenger_name}. Your flight {flight_info.get('flight_number')} is closing doors. Please report to gate {flight_info.get('gate', '')} immediately.",
            }

        first_message = first_messages.get(reminder_type, first_messages['gate_closing'])

        return self.create_outbound_call(
            agent_id=agent_id,
            phone_number=phone_number,
            first_message=first_message,
            dynamic_variables=dynamic_variables,
        )

    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get details of a conversation/call."""
        if not self.api_key:
            return None

        try:
            import httpx

            headers = {
                "xi-api-key": self.api_key,
            }

            with httpx.Client(timeout=30.0) as client:
                response = client.get(
                    f"{self.CONV_AI_URL}/conversations/{conversation_id}",
                    headers=headers,
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"ElevenLabs get conversation error: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"ElevenLabs get conversation error: {e}")
            return None

    def is_outbound_configured(self) -> bool:
        """Check if outbound calling is configured."""
        return bool(self.api_key and (self.agent_id or self.reminder_agent_id))


# Pre-defined responses for common phrases (to reduce API calls)
CACHED_PHRASES = {
    "greeting": "Hi! I'm your American Airlines assistant. I'm here to help with your trip. What do you need today?",
    "ask_confirmation_code": "I'd be happy to help you change your flight. What's your confirmation code? You can spell it out letter by letter.",
    "code_not_found": "I couldn't find a reservation with that code. Could you please check and try again?",
    "change_confirmed": "Perfect! You're all set. Your new flight has been booked. I'm sending the details to your email. Is there anything else I can help with?",
    "goodbye": "You're welcome! Have a wonderful trip. Goodbye!",
}
