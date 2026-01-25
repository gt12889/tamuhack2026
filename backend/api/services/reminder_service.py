"""
Outbound call reminder service for flight notifications.
Uses Retell AI or ElevenLabs + Twilio to call passengers with gate and departure reminders.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from django.utils import timezone
from django.conf import settings
from django.db.models import Q

from ..models import Reservation, FlightSegment, Passenger
from .retell_service import retell_service
from .elevenlabs_service import ElevenLabsService

logger = logging.getLogger(__name__)


class ReminderService:
    """
    Service for scheduling and making outbound reminder calls.

    Supports two providers:
    - Retell AI (direct phone calls)
    - ElevenLabs + Twilio (Conversational AI)

    Reminder Types:
    - Gate closing reminder (30 min before departure)
    - Final boarding call (15 min before departure)
    - Flight departure reminder (1 hour before)
    """

    # Reminder windows (minutes before departure)
    REMINDER_WINDOWS = {
        'departure_1hr': 60,      # 1 hour before departure
        'gate_closing': 30,       # 30 min before (gates typically close)
        'final_boarding': 15,     # 15 min final call
    }

    # Provider options: 'retell' or 'elevenlabs'
    PROVIDER_RETELL = 'retell'
    PROVIDER_ELEVENLABS = 'elevenlabs'

    def __init__(self):
        self.retell = retell_service
        self.elevenlabs = ElevenLabsService()
        # Default to elevenlabs if configured, otherwise retell
        self.default_provider = getattr(settings, 'REMINDER_CALL_PROVIDER', 'elevenlabs')

    def get_upcoming_flights(
        self,
        minutes_ahead: int = 120,
        reminder_type: str = 'departure_1hr'
    ) -> List[Dict[str, Any]]:
        """
        Get flights departing within the specified window.

        Args:
            minutes_ahead: How far ahead to look (default 2 hours)
            reminder_type: Type of reminder to filter for

        Returns:
            List of flight segments with passenger info
        """
        now = timezone.now()
        window_minutes = self.REMINDER_WINDOWS.get(reminder_type, 60)

        # Calculate the target window
        # e.g., for gate_closing (30 min), find flights departing in 30-35 min
        target_start = now + timedelta(minutes=window_minutes)
        target_end = now + timedelta(minutes=window_minutes + 5)

        segments = FlightSegment.objects.select_related(
            'reservation__passenger',
            'flight'
        ).filter(
            flight__departure_time__gte=target_start,
            flight__departure_time__lte=target_end,
            reservation__status__in=['confirmed', 'changed'],
        )

        results = []
        for segment in segments:
            passenger = segment.reservation.passenger
            flight = segment.flight

            results.append({
                'segment_id': segment.id,
                'reservation_code': segment.reservation.confirmation_code,
                'passenger_name': f"{passenger.first_name} {passenger.last_name}",
                'passenger_phone': passenger.phone,
                'passenger_email': passenger.email,
                'language': passenger.language_preference or 'en',
                'flight_number': flight.flight_number,
                'origin': flight.origin,
                'destination': flight.destination,
                'departure_time': flight.departure_time.isoformat(),
                'gate': flight.gate or 'TBD',
                'seat': segment.seat or 'Not assigned',
            })

        return results

    def create_reminder_call(
        self,
        passenger_phone: str,
        passenger_name: str,
        flight_info: Dict[str, Any],
        reminder_type: str = 'gate_closing',
        language: str = 'en',
        provider: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create an outbound reminder call to a passenger.

        Args:
            passenger_phone: Phone number in E.164 format
            passenger_name: Passenger's name
            flight_info: Flight details dict
            reminder_type: Type of reminder
            language: Language preference (en/es)
            provider: 'retell' or 'elevenlabs' (defaults to settings)

        Returns:
            Call details or None on failure
        """
        if not passenger_phone:
            logger.warning(f"No phone number for passenger {passenger_name}")
            return None

        provider = provider or self.default_provider

        # Try ElevenLabs first (preferred for voice quality)
        if provider == self.PROVIDER_ELEVENLABS:
            if self.elevenlabs.is_outbound_configured():
                result = self.elevenlabs.create_reminder_call(
                    phone_number=passenger_phone,
                    passenger_name=passenger_name,
                    flight_info=flight_info,
                    reminder_type=reminder_type,
                    language=language,
                )
                if result:
                    logger.info(f"ElevenLabs reminder call initiated to {passenger_name} for flight {flight_info.get('flight_number')}")
                    return {**result, 'provider': 'elevenlabs'}
            else:
                logger.warning("ElevenLabs not configured, falling back to Retell")
                provider = self.PROVIDER_RETELL

        # Fallback to Retell
        if provider == self.PROVIDER_RETELL:
            if not self.retell.is_configured():
                logger.warning("Retell not configured for outbound calls")
                return None

            # Build reminder message context
            metadata = {
                'reminder_type': reminder_type,
                'passenger_name': passenger_name,
                'flight_number': flight_info.get('flight_number'),
                'origin': flight_info.get('origin'),
                'destination': flight_info.get('destination'),
                'departure_time': flight_info.get('departure_time'),
                'gate': flight_info.get('gate'),
                'seat': flight_info.get('seat'),
                'language': language,
                'message_type': 'outbound_reminder',
            }

            # Get or create reminder agent
            agent_id = self._get_reminder_agent_id()
            if not agent_id:
                logger.error("No reminder agent configured")
                return None

            # Make the outbound call
            result = self.retell.create_phone_call(
                agent_id=agent_id,
                to_number=passenger_phone,
                metadata=metadata,
            )

            if result:
                logger.info(f"Retell reminder call initiated to {passenger_name} for flight {flight_info.get('flight_number')}")
                return {**result, 'provider': 'retell'}

        return None

    def send_gate_closing_reminders(self) -> List[Dict[str, Any]]:
        """
        Send gate closing reminders (30 min before departure).

        Returns:
            List of call results
        """
        flights = self.get_upcoming_flights(
            minutes_ahead=35,
            reminder_type='gate_closing'
        )

        results = []
        for flight in flights:
            if flight.get('passenger_phone'):
                result = self.create_reminder_call(
                    passenger_phone=flight['passenger_phone'],
                    passenger_name=flight['passenger_name'],
                    flight_info=flight,
                    reminder_type='gate_closing',
                    language=flight.get('language', 'en'),
                )
                results.append({
                    'passenger': flight['passenger_name'],
                    'flight': flight['flight_number'],
                    'status': 'called' if result else 'failed',
                    'call_id': result.get('call_id') if result else None,
                })

        return results

    def send_departure_reminders(self) -> List[Dict[str, Any]]:
        """
        Send 1-hour departure reminders.

        Returns:
            List of call results
        """
        flights = self.get_upcoming_flights(
            minutes_ahead=65,
            reminder_type='departure_1hr'
        )

        results = []
        for flight in flights:
            if flight.get('passenger_phone'):
                result = self.create_reminder_call(
                    passenger_phone=flight['passenger_phone'],
                    passenger_name=flight['passenger_name'],
                    flight_info=flight,
                    reminder_type='departure_1hr',
                    language=flight.get('language', 'en'),
                )
                results.append({
                    'passenger': flight['passenger_name'],
                    'flight': flight['flight_number'],
                    'status': 'called' if result else 'failed',
                    'call_id': result.get('call_id') if result else None,
                })

        return results

    def send_manual_reminder(
        self,
        reservation_code: str,
        reminder_type: str = 'gate_closing',
    ) -> Optional[Dict[str, Any]]:
        """
        Manually trigger a reminder call for a specific reservation.

        Args:
            reservation_code: The reservation confirmation code
            reminder_type: Type of reminder to send

        Returns:
            Call result or None
        """
        try:
            reservation = Reservation.objects.select_related(
                'passenger'
            ).prefetch_related(
                'flight_segments__flight'
            ).get(confirmation_code=reservation_code.upper())
        except Reservation.DoesNotExist:
            logger.error(f"Reservation {reservation_code} not found")
            return None

        segment = reservation.flight_segments.first()
        if not segment:
            logger.error(f"No flight segments for reservation {reservation_code}")
            return None

        passenger = reservation.passenger
        flight = segment.flight

        flight_info = {
            'flight_number': flight.flight_number,
            'origin': flight.origin,
            'destination': flight.destination,
            'departure_time': flight.departure_time.isoformat(),
            'gate': flight.gate or 'TBD',
            'seat': segment.seat or 'Not assigned',
        }

        return self.create_reminder_call(
            passenger_phone=passenger.phone,
            passenger_name=f"{passenger.first_name} {passenger.last_name}",
            flight_info=flight_info,
            reminder_type=reminder_type,
            language=passenger.language_preference or 'en',
        )

    def _get_reminder_agent_id(self) -> Optional[str]:
        """Get or create a Retell agent for reminder calls."""
        from django.conf import settings

        # Check if agent ID is configured
        agent_id = getattr(settings, 'RETELL_REMINDER_AGENT_ID', None)
        if agent_id:
            return agent_id

        # Try to find existing reminder agent
        agents = self.retell.list_agents()
        if agents:
            for agent in agents:
                if 'reminder' in agent.get('agent_name', '').lower():
                    return agent.get('agent_id')

        # Create a new reminder agent
        result = self.retell.create_agent(
            agent_name="AA Flight Reminder",
            voice_id="eleven_labs_rachel",
        )

        if result:
            return result.get('agent_id')

        return None


# Singleton instance
reminder_service = ReminderService()
