"""
Location alert service for notifying passengers and family helpers
when the elderly user is running late to their gate.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from django.utils import timezone

from ..models import Session, LocationAlert
from .location_service import location_service, AlertStatus
from .reminder_service import reminder_service
from .resend_service import resend_service

logger = logging.getLogger(__name__)


class LocationAlertService:
    """
    Service for managing location-based alerts.
    Notifies both the elderly user (voice call) and family helper (email/dashboard).
    """

    # Minimum time between alerts of the same type (minutes)
    ALERT_COOLDOWN = 10

    def send_running_late_alert(
        self,
        session_id: str,
        force: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Send a running late alert to both user and family helper.

        Args:
            session_id: Session UUID
            force: Skip cooldown check if True

        Returns:
            Dict with alert details or None if not sent
        """
        try:
            session = Session.objects.select_related(
                'reservation__passenger'
            ).prefetch_related(
                'reservation__flight_segments__flight'
            ).get(id=session_id)
        except Session.DoesNotExist:
            logger.warning(f"Session {session_id} not found for location alert")
            return None

        if not session.reservation:
            logger.warning(f"No reservation for session {session_id}")
            return None

        # Check cooldown
        if not force:
            recent_alert = session.location_alerts.filter(
                alert_type='running_late',
                created_at__gte=timezone.now() - timedelta(minutes=self.ALERT_COOLDOWN)
            ).first()
            if recent_alert:
                logger.info(f"Alert cooldown active for session {session_id}")
                return None

        # Get location metrics
        metrics = location_service.get_location_metrics(session_id)

        passenger = session.reservation.passenger
        segment = session.reservation.flight_segments.first()
        if not segment:
            return None

        flight = segment.flight
        passenger_name = f"{passenger.first_name} {passenger.last_name}"

        # Build alert message
        distance = metrics['metrics'].get('distance_meters', 0)
        walking_time = metrics['metrics'].get('walking_time_minutes', 0)
        time_to_departure = metrics['metrics'].get('time_to_departure_minutes', 0)

        message = self._build_alert_message(
            passenger.first_name,
            flight.gate or 'your gate',
            walking_time,
            time_to_departure,
            passenger.language_preference or 'en'
        )

        # Create alert record
        alert = LocationAlert.objects.create(
            session=session,
            alert_type='running_late',
            message=message,
            distance_to_gate=distance,
            estimated_walking_time=walking_time,
            time_to_departure=time_to_departure,
        )

        result = {
            'alert_id': str(alert.id),
            'alert_type': 'running_late',
            'message': message,
            'voice_call_sent': False,
            'email_sent': False,
        }

        # 1. Voice call to elderly user with directions
        if passenger.phone:
            flight_info = {
                'flight_number': flight.flight_number,
                'origin': flight.origin,
                'destination': flight.destination,
                'departure_time': flight.departure_time.isoformat(),
                'gate': flight.gate or 'TBD',
                'seat': segment.seat or 'Not assigned',
            }

            call_result = reminder_service.create_reminder_call(
                passenger_phone=passenger.phone,
                passenger_name=passenger_name,
                flight_info=flight_info,
                reminder_type='running_late',
                language=passenger.language_preference or 'en',
            )

            if call_result:
                alert.voice_call_sent = True
                result['voice_call_sent'] = True
                result['call_id'] = call_result.get('call_id')
                logger.info(f"Voice call sent to {passenger_name} for running late alert")

        # 2. Email to family helper (get email from session context or helper settings)
        helper_email = self._get_helper_email(session)
        if helper_email:
            email_result = self._send_helper_email(
                helper_email=helper_email,
                passenger_name=passenger_name,
                flight=flight,
                gate=flight.gate,
                distance=distance,
                walking_time=walking_time,
                time_to_departure=time_to_departure,
                directions=metrics.get('directions', ''),
            )

            if email_result:
                alert.email_sent = True
                result['email_sent'] = True
                logger.info(f"Email sent to helper {helper_email} for running late alert")

        # 3. Update session context for dashboard notification
        if not session.context:
            session.context = {}

        session.context['location_alert'] = {
            'type': 'running_late',
            'timestamp': timezone.now().isoformat(),
            'message': message,
            'metrics': {
                'distance_meters': distance,
                'walking_time_minutes': walking_time,
                'time_to_departure_minutes': time_to_departure,
            }
        }

        alert.save()
        session.save()

        return result

    def send_urgent_alert(
        self,
        session_id: str,
        force: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Send an urgent alert when passenger may miss their flight.

        Args:
            session_id: Session UUID
            force: Skip cooldown check if True

        Returns:
            Dict with alert details or None if not sent
        """
        try:
            session = Session.objects.select_related(
                'reservation__passenger'
            ).prefetch_related(
                'reservation__flight_segments__flight'
            ).get(id=session_id)
        except Session.DoesNotExist:
            return None

        if not session.reservation:
            return None

        # Check cooldown
        if not force:
            recent_alert = session.location_alerts.filter(
                alert_type='urgent',
                created_at__gte=timezone.now() - timedelta(minutes=5)  # Shorter cooldown for urgent
            ).first()
            if recent_alert:
                return None

        metrics = location_service.get_location_metrics(session_id)
        passenger = session.reservation.passenger
        segment = session.reservation.flight_segments.first()
        if not segment:
            return None

        flight = segment.flight
        walking_time = metrics['metrics'].get('walking_time_minutes', 0)
        time_to_departure = metrics['metrics'].get('time_to_departure_minutes', 0)

        message = self._build_urgent_message(
            passenger.first_name,
            flight.gate or 'your gate',
            walking_time,
            time_to_departure,
            passenger.language_preference or 'en'
        )

        alert = LocationAlert.objects.create(
            session=session,
            alert_type='urgent',
            message=message,
            distance_to_gate=metrics['metrics'].get('distance_meters'),
            estimated_walking_time=walking_time,
            time_to_departure=time_to_departure,
        )

        result = {
            'alert_id': str(alert.id),
            'alert_type': 'urgent',
            'message': message,
        }

        # Voice call with urgent message
        if passenger.phone:
            flight_info = {
                'flight_number': flight.flight_number,
                'origin': flight.origin,
                'destination': flight.destination,
                'departure_time': flight.departure_time.isoformat(),
                'gate': flight.gate or 'TBD',
            }

            call_result = reminder_service.create_reminder_call(
                passenger_phone=passenger.phone,
                passenger_name=f"{passenger.first_name} {passenger.last_name}",
                flight_info=flight_info,
                reminder_type='urgent',
                language=passenger.language_preference or 'en',
            )

            if call_result:
                alert.voice_call_sent = True
                result['voice_call_sent'] = True

        alert.save()
        return result

    def check_and_send_alerts(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Check location status and send appropriate alerts automatically.

        Called when location is updated to evaluate if alerts are needed.

        Args:
            session_id: Session UUID

        Returns:
            Alert result or None if no alert needed
        """
        metrics = location_service.get_location_metrics(session_id)
        alert_status = metrics.get('metrics', {}).get('alert_status')

        if alert_status == AlertStatus.URGENT.value:
            return self.send_urgent_alert(session_id)
        elif alert_status == AlertStatus.WARNING.value:
            return self.send_running_late_alert(session_id)

        return None

    def acknowledge_alert(self, alert_id: str) -> bool:
        """
        Mark an alert as acknowledged.

        Args:
            alert_id: LocationAlert UUID

        Returns:
            True if acknowledged successfully
        """
        try:
            alert = LocationAlert.objects.get(id=alert_id)
            alert.acknowledged = True
            alert.save()
            return True
        except LocationAlert.DoesNotExist:
            return False

    def _get_helper_email(self, session: Session) -> Optional[str]:
        """Get the family helper's email from session context."""
        # Check context for stored helper email
        if session.context and session.context.get('helper_email'):
            return session.context['helper_email']

        # For now, we could use passenger email as fallback
        # In production, this would come from a separate helper registration
        return None

    def _send_helper_email(
        self,
        helper_email: str,
        passenger_name: str,
        flight,
        gate: str,
        distance: float,
        walking_time: int,
        time_to_departure: int,
        directions: str,
    ) -> Optional[Dict[str, Any]]:
        """Send location alert email to family helper."""
        if not resend_service.is_configured():
            logger.warning("Resend not configured for location alerts")
            return None

        try:
            import resend

            subject = f"Alert: {passenger_name} may be running late for flight {flight.flight_number}"

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #dc3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="margin: 0;">Location Alert</h1>
                </div>

                <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 18px;">
                        <strong>{passenger_name}</strong> may be running late for their flight.
                    </p>

                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #856404;">Current Status</h3>
                        <ul style="margin: 0; color: #856404;">
                            <li>Distance to gate: <strong>{int(distance)} meters</strong></li>
                            <li>Estimated walking time: <strong>{walking_time} minutes</strong></li>
                            <li>Time until departure: <strong>{time_to_departure} minutes</strong></li>
                            <li>Gate: <strong>{gate}</strong></li>
                        </ul>
                    </div>

                    <div style="background: #e7f1ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #0d6efd;">Directions</h3>
                        <p style="margin: 0;">{directions}</p>
                    </div>

                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0;">Flight Details</h3>
                        <p style="margin: 5px 0;"><strong>{flight.flight_number}</strong></p>
                        <p style="margin: 5px 0;">{flight.origin} → {flight.destination}</p>
                        <p style="margin: 5px 0;">Departure: {flight.departure_time.strftime('%I:%M %p')}</p>
                    </div>

                    <p style="color: #666;">
                        You can monitor their progress on the Family Helper dashboard.
                    </p>
                </div>
            </body>
            </html>
            """

            response = resend.Emails.send({
                "from": resend_service.from_email,
                "to": [helper_email],
                "subject": subject,
                "html": html_content,
            })

            return response

        except Exception as e:
            logger.error(f"Failed to send helper location alert email: {e}")
            return None

    def _build_alert_message(
        self,
        first_name: str,
        gate: str,
        walking_time: int,
        time_to_departure: int,
        language: str
    ) -> str:
        """Build the alert message for running late."""
        if language == 'es':
            return (
                f"{first_name}, puede estar llegando tarde a su puerta. "
                f"La puerta {gate} esta a aproximadamente {walking_time} minutos caminando, "
                f"y su vuelo sale en {time_to_departure} minutos. "
                f"Por favor dirijase a la puerta ahora."
            )

        return (
            f"{first_name}, you may be running late for your gate. "
            f"Gate {gate} is about {walking_time} minutes away, "
            f"and your flight departs in {time_to_departure} minutes. "
            f"Please head to your gate now."
        )

    def _build_urgent_message(
        self,
        first_name: str,
        gate: str,
        walking_time: int,
        time_to_departure: int,
        language: str
    ) -> str:
        """Build urgent alert message."""
        if language == 'es':
            return (
                f"URGENTE: {first_name}, puede perder su vuelo! "
                f"La puerta {gate} cierra en {time_to_departure - 15} minutos "
                f"y usted esta a {walking_time} minutos de distancia. "
                f"Por favor corra a su puerta inmediatamente!"
            )

        return (
            f"URGENT: {first_name}, you may miss your flight! "
            f"Gate {gate} closes in {time_to_departure - 15} minutes "
            f"and you are {walking_time} minutes away. "
            f"Please hurry to your gate immediately!"
        )


# Singleton instance
location_alert_service = LocationAlertService()
