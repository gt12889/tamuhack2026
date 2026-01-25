"""Family action service for executing helper actions directly.

This service handles the execution of family member actions on behalf of
the passenger, such as flight changes, cancellations, seat selection, etc.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction

from ..models import Session, FamilyAction, Reservation, Flight, FlightSegment
from ..serializers import ReservationSerializer
from .resend_service import resend_service

logger = logging.getLogger(__name__)


# Available action types with display information
ACTION_TYPES = {
    'change_flight': {
        'display_name': 'Change Flight',
        'description': 'Select a new flight from available alternatives',
        'icon': 'plane',
    },
    'cancel_flight': {
        'display_name': 'Cancel Flight',
        'description': 'Cancel the reservation',
        'icon': 'x-circle',
    },
    'select_seat': {
        'display_name': 'Select Seat',
        'description': 'Choose a seat from available options',
        'icon': 'armchair',
    },
    'add_bags': {
        'display_name': 'Add Baggage',
        'description': 'Add checked bags to the reservation',
        'icon': 'briefcase',
    },
    'request_wheelchair': {
        'display_name': 'Request Wheelchair',
        'description': 'Request wheelchair assistance',
        'icon': 'accessibility',
    },
}


class FamilyActionService:
    """Service for executing family helper actions."""

    def get_available_actions(self, session: Session) -> List[Dict[str, Any]]:
        """
        Get list of available actions for a session.

        Returns actions that can be performed based on reservation state.
        """
        if not session.reservation:
            return []

        reservation = session.reservation
        actions = []

        # Only show relevant actions based on reservation status
        if reservation.status != 'cancelled':
            actions.append({
                **ACTION_TYPES['change_flight'],
                'action_type': 'change_flight',
                'enabled': True,
            })
            actions.append({
                **ACTION_TYPES['cancel_flight'],
                'action_type': 'cancel_flight',
                'enabled': True,
            })
            actions.append({
                **ACTION_TYPES['select_seat'],
                'action_type': 'select_seat',
                'enabled': True,
            })
            actions.append({
                **ACTION_TYPES['add_bags'],
                'action_type': 'add_bags',
                'enabled': True,
            })
            actions.append({
                **ACTION_TYPES['request_wheelchair'],
                'action_type': 'request_wheelchair',
                'enabled': True,
            })

        return actions

    def get_action_history(self, session: Session) -> List[Dict[str, Any]]:
        """Get history of actions taken for a session."""
        actions = session.family_actions.all()
        return [
            {
                'id': str(action.id),
                'action_type': action.action_type,
                'display_name': ACTION_TYPES.get(action.action_type, {}).get('display_name', action.action_type),
                'action_data': action.action_data,
                'status': action.status,
                'family_notes': action.family_notes,
                'result_message': action.result_message,
                'created_at': action.created_at.isoformat(),
            }
            for action in actions
        ]

    @transaction.atomic
    def execute_change_flight(
        self,
        session: Session,
        new_flight_id: str,
        notes: str = ''
    ) -> Dict[str, Any]:
        """
        Execute a flight change action.

        Args:
            session: The session with the reservation
            new_flight_id: ID of the new flight to change to
            notes: Optional notes from family member

        Returns:
            Result dict with success status and message
        """
        if not session.reservation:
            return self._create_failed_action(
                session, 'change_flight',
                {'new_flight_id': new_flight_id},
                notes,
                'No reservation found'
            )

        reservation = session.reservation

        # Get the first flight segment to change
        first_segment = reservation.flight_segments.first()
        if not first_segment:
            return self._create_failed_action(
                session, 'change_flight',
                {'new_flight_id': new_flight_id},
                notes,
                'No flight segment found'
            )

        # Store original flight data
        original_flight = {
            'flight_number': first_segment.flight.flight_number,
            'origin': first_segment.flight.origin,
            'destination': first_segment.flight.destination,
            'departure_time': first_segment.flight.departure_time.isoformat(),
            'arrival_time': first_segment.flight.arrival_time.isoformat() if first_segment.flight.arrival_time else '',
            'seat': first_segment.seat or 'Not assigned',
        }

        # For demo purposes, we'll create a mock new flight
        # In production, this would look up the flight by ID
        from ..mock_data import get_alternative_flights

        # Try to find the flight in alternatives
        target_date = first_segment.flight.departure_time + timedelta(days=1)
        alternatives = get_alternative_flights(
            first_segment.flight.origin,
            first_segment.flight.destination,
            target_date.strftime('%Y-%m-%d')
        )

        new_flight_data = None
        for alt in alternatives:
            if alt.get('id') == new_flight_id or alt.get('flight_number') == new_flight_id:
                new_flight_data = alt
                break

        if not new_flight_data and alternatives:
            # Use first alternative as fallback for demo
            new_flight_data = alternatives[0]

        if not new_flight_data:
            return self._create_failed_action(
                session, 'change_flight',
                {'new_flight_id': new_flight_id},
                notes,
                'New flight not found'
            )

        # Update reservation status
        reservation.status = 'changed'
        reservation.save()

        # Create success action
        action = FamilyAction.objects.create(
            session=session,
            action_type='change_flight',
            action_data={
                'original_flight': original_flight,
                'new_flight': new_flight_data,
            },
            status='executed',
            family_notes=notes,
            result_message=f"Flight changed from {original_flight['flight_number']} to {new_flight_data.get('flight_number', 'new flight')}",
        )

        # Send notification email
        self._send_change_notification(reservation, original_flight, new_flight_data)

        return {
            'success': True,
            'action_id': str(action.id),
            'message': action.result_message,
            'original_flight': original_flight,
            'new_flight': new_flight_data,
        }

    @transaction.atomic
    def execute_cancel_flight(
        self,
        session: Session,
        reason: str = '',
        notes: str = ''
    ) -> Dict[str, Any]:
        """Execute a flight cancellation action."""
        if not session.reservation:
            return self._create_failed_action(
                session, 'cancel_flight',
                {'reason': reason},
                notes,
                'No reservation found'
            )

        reservation = session.reservation

        if reservation.status == 'cancelled':
            return self._create_failed_action(
                session, 'cancel_flight',
                {'reason': reason},
                notes,
                'Reservation already cancelled'
            )

        # Store flight info before cancellation
        flight_info = []
        for segment in reservation.flight_segments.all():
            flight_info.append({
                'flight_number': segment.flight.flight_number,
                'origin': segment.flight.origin,
                'destination': segment.flight.destination,
                'departure_time': segment.flight.departure_time.isoformat(),
            })

        # Cancel the reservation
        reservation.status = 'cancelled'
        reservation.save()

        # Create action record
        action = FamilyAction.objects.create(
            session=session,
            action_type='cancel_flight',
            action_data={
                'reason': reason,
                'cancelled_flights': flight_info,
            },
            status='executed',
            family_notes=notes,
            result_message=f"Reservation {reservation.confirmation_code} has been cancelled",
        )

        return {
            'success': True,
            'action_id': str(action.id),
            'message': action.result_message,
            'cancelled_flights': flight_info,
        }

    @transaction.atomic
    def execute_select_seat(
        self,
        session: Session,
        seat: str,
        flight_segment_id: Optional[str] = None,
        notes: str = ''
    ) -> Dict[str, Any]:
        """Execute a seat selection action."""
        if not session.reservation:
            return self._create_failed_action(
                session, 'select_seat',
                {'seat': seat},
                notes,
                'No reservation found'
            )

        reservation = session.reservation

        # Get the target flight segment
        if flight_segment_id:
            try:
                segment = reservation.flight_segments.get(id=flight_segment_id)
            except FlightSegment.DoesNotExist:
                return self._create_failed_action(
                    session, 'select_seat',
                    {'seat': seat, 'flight_segment_id': flight_segment_id},
                    notes,
                    'Flight segment not found'
                )
        else:
            # Default to first segment
            segment = reservation.flight_segments.first()
            if not segment:
                return self._create_failed_action(
                    session, 'select_seat',
                    {'seat': seat},
                    notes,
                    'No flight segment found'
                )

        old_seat = segment.seat
        segment.seat = seat.upper()
        segment.save()

        # Create action record
        action = FamilyAction.objects.create(
            session=session,
            action_type='select_seat',
            action_data={
                'old_seat': old_seat,
                'new_seat': seat.upper(),
                'flight_number': segment.flight.flight_number,
            },
            status='executed',
            family_notes=notes,
            result_message=f"Seat changed to {seat.upper()} on flight {segment.flight.flight_number}",
        )

        return {
            'success': True,
            'action_id': str(action.id),
            'message': action.result_message,
            'old_seat': old_seat,
            'new_seat': seat.upper(),
        }

    @transaction.atomic
    def execute_add_bags(
        self,
        session: Session,
        bag_count: int,
        notes: str = ''
    ) -> Dict[str, Any]:
        """Execute an add baggage action."""
        if not session.reservation:
            return self._create_failed_action(
                session, 'add_bags',
                {'bag_count': bag_count},
                notes,
                'No reservation found'
            )

        reservation = session.reservation

        # Store bag info in context (for demo purposes)
        if not session.context:
            session.context = {}

        current_bags = session.context.get('checked_bags', 0)
        session.context['checked_bags'] = current_bags + bag_count
        session.save()

        # Create action record
        action = FamilyAction.objects.create(
            session=session,
            action_type='add_bags',
            action_data={
                'bags_added': bag_count,
                'total_bags': session.context['checked_bags'],
            },
            status='executed',
            family_notes=notes,
            result_message=f"Added {bag_count} checked bag(s). Total: {session.context['checked_bags']} bags",
        )

        return {
            'success': True,
            'action_id': str(action.id),
            'message': action.result_message,
            'bags_added': bag_count,
            'total_bags': session.context['checked_bags'],
        }

    @transaction.atomic
    def execute_request_wheelchair(
        self,
        session: Session,
        assistance_type: str = 'wheelchair',
        notes: str = ''
    ) -> Dict[str, Any]:
        """Execute a wheelchair assistance request action."""
        if not session.reservation:
            return self._create_failed_action(
                session, 'request_wheelchair',
                {'assistance_type': assistance_type},
                notes,
                'No reservation found'
            )

        reservation = session.reservation

        # Store assistance request in context (for demo purposes)
        if not session.context:
            session.context = {}

        session.context['wheelchair_assistance'] = {
            'type': assistance_type,
            'requested_at': timezone.now().isoformat(),
        }
        session.save()

        assistance_names = {
            'wheelchair': 'Wheelchair',
            'wheelchair_ramp': 'Wheelchair with Ramp',
            'escort': 'Escort Assistance',
        }

        # Create action record
        action = FamilyAction.objects.create(
            session=session,
            action_type='request_wheelchair',
            action_data={
                'assistance_type': assistance_type,
            },
            status='executed',
            family_notes=notes,
            result_message=f"{assistance_names.get(assistance_type, assistance_type)} assistance has been requested",
        )

        return {
            'success': True,
            'action_id': str(action.id),
            'message': action.result_message,
            'assistance_type': assistance_type,
        }

    def _create_failed_action(
        self,
        session: Session,
        action_type: str,
        action_data: Dict[str, Any],
        notes: str,
        error_message: str
    ) -> Dict[str, Any]:
        """Create a failed action record and return error response."""
        action = FamilyAction.objects.create(
            session=session,
            action_type=action_type,
            action_data=action_data,
            status='failed',
            family_notes=notes,
            result_message=error_message,
        )

        return {
            'success': False,
            'action_id': str(action.id),
            'error': error_message,
        }

    def _send_change_notification(
        self,
        reservation: Reservation,
        original_flight: Dict[str, Any],
        new_flight: Dict[str, Any]
    ) -> None:
        """Send email notification about flight change."""
        if not reservation.passenger or not reservation.passenger.email:
            return

        try:
            passenger = reservation.passenger
            passenger_name = f"{passenger.first_name} {passenger.last_name}"

            resend_service.send_flight_change_confirmation(
                to_email=passenger.email,
                passenger_name=passenger_name,
                confirmation_code=reservation.confirmation_code,
                original_flight=original_flight,
                new_flight=new_flight,
                language=passenger.language_preference or 'en'
            )
        except Exception as e:
            logger.error(f"Failed to send change notification email: {e}")


# Singleton instance
family_action_service = FamilyActionService()
