"""Retell AI service for real-time voice agent conversations."""

import logging
import json
from typing import Optional, Dict, Any
from django.conf import settings

logger = logging.getLogger(__name__)


class RetellService:
    """Service for Retell AI real-time voice agent platform."""

    API_URL = "https://api.retellai.com"

    def __init__(self):
        self.api_key = getattr(settings, 'RETELL_API_KEY', '')

    def _get_headers(self) -> Dict[str, str]:
        """Get authentication headers for Retell API."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def create_agent(
        self,
        agent_name: str = "AA Voice Concierge",
        voice_id: str = "eleven_labs_rachel",
        llm_websocket_url: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create a Retell voice agent.

        Args:
            agent_name: Name of the agent
            voice_id: Voice to use (Retell voices or ElevenLabs)
            llm_websocket_url: Custom LLM WebSocket URL for agent logic

        Returns:
            Agent configuration dict or None on failure
        """
        if not self.api_key:
            logger.warning("Retell API key not configured")
            return None

        try:
            import httpx

            data = {
                "agent_name": agent_name,
                "voice_id": voice_id,
                "response_engine": {
                    "type": "retell-llm",
                    "llm_id": None,  # Will use default or custom
                },
                "language": "en-US",
                "voice_speed": 0.9,  # Slightly slower for elderly users
                "voice_temperature": 0.7,
                "responsiveness": 0.8,
                "interruption_sensitivity": 0.5,
                "enable_backchannel": True,  # Natural acknowledgments
                "boosted_keywords": [
                    "American Airlines", "flight", "reservation",
                    "confirmation", "change", "cancel", "help"
                ],
            }

            if llm_websocket_url:
                data["response_engine"]["llm_websocket_url"] = llm_websocket_url

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.API_URL}/create-agent",
                    json=data,
                    headers=self._get_headers(),
                )

                if response.status_code == 201:
                    return response.json()
                else:
                    logger.error(f"Retell create agent error: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Retell create agent error: {e}")
            return None

    def list_agents(self) -> Optional[list]:
        """List all configured Retell agents."""
        if not self.api_key:
            logger.warning("Retell API key not configured")
            return None

        try:
            import httpx

            with httpx.Client(timeout=30.0) as client:
                response = client.get(
                    f"{self.API_URL}/list-agents",
                    headers=self._get_headers(),
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Retell list agents error: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Retell list agents error: {e}")
            return None

    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get details for a specific agent."""
        if not self.api_key:
            return None

        try:
            import httpx

            with httpx.Client(timeout=30.0) as client:
                response = client.get(
                    f"{self.API_URL}/get-agent/{agent_id}",
                    headers=self._get_headers(),
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Retell get agent error: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Retell get agent error: {e}")
            return None

    def create_web_call(
        self,
        agent_id: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create a web call for browser-based voice interaction.

        Args:
            agent_id: The agent ID to use for the call
            metadata: Optional metadata to pass to the agent

        Returns:
            Call configuration with access_token for WebSocket connection
        """
        if not self.api_key:
            logger.warning("Retell API key not configured")
            return None

        try:
            import httpx

            data = {
                "agent_id": agent_id,
            }

            if metadata:
                data["metadata"] = metadata

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.API_URL}/v2/create-web-call",
                    json=data,
                    headers=self._get_headers(),
                )

                if response.status_code == 201:
                    return response.json()
                else:
                    logger.error(f"Retell create web call error: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Retell create web call error: {e}")
            return None

    def create_phone_call(
        self,
        agent_id: str,
        to_number: str,
        from_number: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Initiate an outbound phone call.

        Args:
            agent_id: The agent ID to use for the call
            to_number: Phone number to call (E.164 format)
            from_number: Optional caller ID number
            metadata: Optional metadata to pass to the agent

        Returns:
            Call details or None on failure
        """
        if not self.api_key:
            logger.warning("Retell API key not configured")
            return None

        try:
            import httpx

            data = {
                "agent_id": agent_id,
                "to_number": to_number,
            }

            if from_number:
                data["from_number"] = from_number
            if metadata:
                data["metadata"] = metadata

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.API_URL}/v2/create-phone-call",
                    json=data,
                    headers=self._get_headers(),
                )

                if response.status_code == 201:
                    return response.json()
                else:
                    logger.error(f"Retell create phone call error: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Retell create phone call error: {e}")
            return None

    def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        """Get details and transcript for a call."""
        if not self.api_key:
            return None

        try:
            import httpx

            with httpx.Client(timeout=30.0) as client:
                response = client.get(
                    f"{self.API_URL}/v2/get-call/{call_id}",
                    headers=self._get_headers(),
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Retell get call error: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Retell get call error: {e}")
            return None

    def end_call(self, call_id: str) -> bool:
        """End an active call."""
        if not self.api_key:
            return False

        try:
            import httpx

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.API_URL}/v2/end-call/{call_id}",
                    headers=self._get_headers(),
                )

                return response.status_code == 200

        except Exception as e:
            logger.error(f"Retell end call error: {e}")
            return False

    def is_configured(self) -> bool:
        """Check if Retell API key is configured."""
        return bool(self.api_key)


# Singleton instance
retell_service = RetellService()
