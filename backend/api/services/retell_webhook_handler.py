"""Retell AI webhook handler for processing call events and function calls."""

import logging
import json
import hmac
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from django.conf import settings

from ..models import Session, Message, Reservation, Passenger, Flight, FlightSegment
from ..mock_data import (
    get_demo_reservations,
    get_alternative_flights,
    get_flights_for_date,
    CITY_NAMES,
)
from .resend_service import resend_service

logger = logging.getLogger(__name__)


class RetellWebhookHandler:
    """
    Handles Retell AI webhooks and function calls.

    Retell can call these functions during a conversation:
    - lookup_reservation: Find a reservation by confirmation code
    - change_flight: Change a flight to a new date
    - create_booking: Create a new flight booking
    - get_flight_options: Search for available flights
    """

    def __init__(self):
        self.api_key = getattr(settings, 'RETELL_API_KEY', '')

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """Verify webhook signature from Retell."""
        if not self.api_key:
            return False

        expected = hmac.new(
            self.api_key.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected, signature)

    def handle_webhook(self, event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main webhook handler - routes events to appropriate handlers.

        Event types:
        - call_started: A new call has started
        - call_ended: Call has ended
        - call_analyzed: Post-call analysis ready
        - function_call: Agent wants to call a function
        """
        handlers = {
            'call_started': self._handle_call_started,
            'call_ended': self._handle_call_ended,
            'call_analyzed': self._handle_call_analyzed,
            'function_call': self._handle_function_call,
        }

        handler = handlers.get(event_type)
        if handler:
            return handler(data)

        logger.warning(f"Unknown Retell event type: {event_type}")
        return {'status': 'ignored', 'event_type': event_type}

    def _handle_call_started(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle call_started event - create a session for this call."""
        call_id = data.get('call_id')
        from_number = data.get('from_number')

        logger.info(f"Retell call started: {call_id} from {from_number}")

        # Create a session for this call
        session = Session.objects.create(
            state='greeting',
            expires_at=datetime.now() + timedelta(hours=1),
            context={
                'retell_call_id': call_id,
                'phone_number': from_number,
                'source': 'retell_phone',
            },
        )

        return {
            'status': 'success',
            'session_id': str(session.id),
            'call_id': call_id,
        }

    def _handle_call_ended(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle call_ended event - finalize the session."""
        call_id = data.get('call_id')
        duration = data.get('duration_ms', 0)
        transcript = data.get('transcript', [])

        logger.info(f"Retell call ended: {call_id}, duration: {duration}ms")

        # Find and update the session
        try:
            session = Session.objects.get(context__retell_call_id=call_id)
            session.context['call_ended'] = True
            session.context['duration_ms'] = duration
            session.context['transcript'] = transcript
            session.save()

            # Save transcript as messages
            for entry in transcript:
                Message.objects.create(
                    session=session,
                    role='user' if entry.get('role') == 'user' else 'assistant',
                    content=entry.get('content', ''),
                )

            return {'status': 'success', 'session_id': str(session.id)}
        except Session.DoesNotExist:
            logger.warning(f"No session found for call: {call_id}")
            return {'status': 'error', 'message': 'Session not found'}

    def _handle_call_analyzed(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle call_analyzed event - store analysis results."""
        call_id = data.get('call_id')
        analysis = data.get('call_analysis', {})

        logger.info(f"Retell call analyzed: {call_id}")

        try:
            session = Session.objects.get(context__retell_call_id=call_id)
            session.context['analysis'] = analysis
            session.save()
            return {'status': 'success'}
        except Session.DoesNotExist:
            return {'status': 'error', 'message': 'Session not found'}

    def _handle_function_call(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle function_call event - execute the requested function.

        This is where Retell asks your backend to do something
        (lookup reservation, change flight, etc.)
        """
        call_id = data.get('call_id')
        function_name = data.get('function_name')
        arguments = data.get('arguments', {})

        logger.info(f"Retell function call: {function_name} with args: {arguments}")

        # Route to appropriate function handler
        function_handlers = {
            'lookup_reservation': self._fn_lookup_reservation,
            'change_flight': self._fn_change_flight,
            'create_booking': self._fn_create_booking,
            'get_flight_options': self._fn_get_flight_options,
            'get_reservation_status': self._fn_get_reservation_status,
        }

        handler = function_handlers.get(function_name)
        if handler:
            result = handler(arguments, call_id)
            return {
                'status': 'success',
                'function_name': function_name,
                'result': result,
            }

        return {
            'status': 'error',
            'message': f'Unknown function: {function_name}',
        }

    # ==================== Function Implementations ====================

    def _fn_lookup_reservation(self, args: Dict[str, Any], call_id: str) -> Dict[str, Any]:
        """
        Look up a reservation by confirmation code.

        Args:
            confirmation_code: The 6-character confirmation code

        Returns:
            Reservation details or error
        """
        code = args.get('confirmation_code', '').upper().strip()

        if not code:
            return {'success': False, 'error': 'No confirmation code provided'}

        # Check mock data first
        demo_reservations = get_demo_reservations()
        for res_data in demo_reservations:
            if res_data['confirmation_code'].upper() == code:
                # Format for voice response
                passenger = res_data['passenger']
                flights = res_data['flights']
                first_flight = flights[0] if flights else None

                if first_flight:
                    from dateutil.parser import parse
                    dep_time = parse(first_flight['departure_time'])
                    origin_city = CITY_NAMES.get(first_flight['origin'], first_flight['origin'])
                    dest_city = CITY_NAMES.get(first_flight['destination'], first_flight['destination'])

                    return {
                        'success': True,
                        'found': True,
                        'confirmation_code': code,
                        'passenger_name': f"{passenger['first_name']} {passenger['last_name']}",
                        'origin': first_flight['origin'],
                        'origin_city': origin_city,
                        'destination': first_flight['destination'],
                        'destination_city': dest_city,
                        'departure_date': dep_time.strftime('%B %d'),
                        'departure_time': dep_time.strftime('%I:%M %p'),
                        'flight_number': first_flight['flight_number'],
                        'seat': first_flight.get('seat', 'Not assigned'),
                    }

                return {
                    'success': True,
                    'found': True,
                    'confirmation_code': code,
                    'passenger_name': f"{passenger['first_name']} {passenger['last_name']}",
                    'message': 'Reservation found but no flight details available',
                }

        # Check database
        try:
            reservation = Reservation.objects.get(confirmation_code=code)
            segment = reservation.flight_segments.first()

            if segment:
                return {
                    'success': True,
                    'found': True,
                    'confirmation_code': code,
                    'passenger_name': f"{reservation.passenger.first_name} {reservation.passenger.last_name}",
                    'origin': segment.flight.origin,
                    'origin_city': CITY_NAMES.get(segment.flight.origin, segment.flight.origin),
                    'destination': segment.flight.destination,
                    'destination_city': CITY_NAMES.get(segment.flight.destination, segment.flight.destination),
                    'departure_date': segment.flight.departure_time.strftime('%B %d'),
                    'departure_time': segment.flight.departure_time.strftime('%I:%M %p'),
                    'flight_number': segment.flight.flight_number,
                }
        except Reservation.DoesNotExist:
            pass

        return {
            'success': True,
            'found': False,
            'error': f'No reservation found with code {code}',
        }

    def _fn_change_flight(self, args: Dict[str, Any], call_id: str) -> Dict[str, Any]:
        """
        Change a flight to a new date/time.

        Args:
            confirmation_code: The reservation code
            new_date: The new date (e.g., "tomorrow", "January 26", "2026-01-26")
            preferred_time: Optional time preference ("morning", "afternoon", "evening")

        Returns:
            New flight details or available options
        """
        code = args.get('confirmation_code', '').upper().strip()
        new_date = args.get('new_date', '')
        preferred_time = args.get('preferred_time', '')
        selected_flight_id = args.get('selected_flight_id')

        if not code:
            return {'success': False, 'error': 'No confirmation code provided'}

        # Look up the reservation
        demo_reservations = get_demo_reservations()
        reservation = None
        for res_data in demo_reservations:
            if res_data['confirmation_code'].upper() == code:
                reservation = res_data
                break

        if not reservation:
            return {'success': False, 'error': f'Reservation {code} not found'}

        first_flight = reservation['flights'][0] if reservation['flights'] else None
        if not first_flight:
            return {'success': False, 'error': 'No flight found in reservation'}

        # Parse the new date
        from dateutil.parser import parse
        from dateutil.relativedelta import relativedelta

        try:
            if new_date.lower() == 'tomorrow':
                target_date = datetime.now() + timedelta(days=1)
            elif new_date.lower() == 'next week':
                target_date = datetime.now() + timedelta(weeks=1)
            else:
                target_date = parse(new_date)
        except:
            target_date = datetime.now() + timedelta(days=1)

        # Get alternative flights
        alternatives = get_alternative_flights(
            first_flight['origin'],
            first_flight['destination'],
            target_date.strftime('%Y-%m-%d')
        )

        if not alternatives:
            return {
                'success': False,
                'error': f'No flights available on {target_date.strftime("%B %d")}',
            }

        # If a specific flight was selected, confirm the change
        if selected_flight_id:
            selected = next((f for f in alternatives if f.get('id') == selected_flight_id), None)
            if selected:
                return {
                    'success': True,
                    'changed': True,
                    'message': 'Flight successfully changed',
                    'new_flight': {
                        'flight_number': selected['flight_number'],
                        'departure_date': parse(selected['departure_time']).strftime('%B %d'),
                        'departure_time': parse(selected['departure_time']).strftime('%I:%M %p'),
                        'origin': selected['origin'],
                        'destination': selected['destination'],
                    },
                    'confirmation_code': code,
                }

        # Return available options
        options = []
        for alt in alternatives[:3]:  # Max 3 options
            dep_time = parse(alt['departure_time'])
            options.append({
                'id': alt.get('id', alt['flight_number']),
                'flight_number': alt['flight_number'],
                'departure_time': dep_time.strftime('%I:%M %p'),
                'departure_date': dep_time.strftime('%B %d'),
                'price': alt.get('price', 'Same price'),
            })

        return {
            'success': True,
            'changed': False,
            'options_available': True,
            'options': options,
            'message': f'Found {len(options)} flights on {target_date.strftime("%B %d")}',
        }

    def _fn_create_booking(self, args: Dict[str, Any], call_id: str) -> Dict[str, Any]:
        """
        Create a new flight booking.

        Args:
            origin: Origin airport code or city
            destination: Destination airport code or city
            date: Departure date
            first_name: Passenger first name
            last_name: Passenger last name
            email: Passenger email for confirmation (optional)
            selected_flight_id: The selected flight option

        Returns:
            Booking confirmation or error
        """
        origin = args.get('origin', '').upper()
        destination = args.get('destination', '').upper()
        date = args.get('date', '')
        first_name = args.get('first_name', '')
        last_name = args.get('last_name', '')
        user_provided_email = args.get('email', '')
        email = user_provided_email or 't.dinh43204@gmail.com'  # Default email for demo
        selected_flight_id = args.get('selected_flight_id')

        # Map city names to codes
        city_to_code = {v.upper(): k for k, v in CITY_NAMES.items()}
        if origin in city_to_code:
            origin = city_to_code[origin]
        if destination in city_to_code:
            destination = city_to_code[destination]

        if not all([origin, destination, date]):
            missing = []
            if not origin: missing.append('origin')
            if not destination: missing.append('destination')
            if not date: missing.append('date')
            return {
                'success': False,
                'error': f'Missing required fields: {", ".join(missing)}',
                'needs': missing,
            }

        # Parse date
        from dateutil.parser import parse
        try:
            if date.lower() == 'tomorrow':
                target_date = datetime.now() + timedelta(days=1)
            elif 'next' in date.lower():
                # Handle "next Tuesday", etc.
                target_date = datetime.now() + timedelta(days=7)
            else:
                target_date = parse(date)
        except:
            target_date = datetime.now() + timedelta(days=1)

        # Search for flights
        flights = get_alternative_flights(origin, destination, target_date.strftime('%Y-%m-%d'))

        if not flights:
            return {
                'success': False,
                'error': f'No flights found from {CITY_NAMES.get(origin, origin)} to {CITY_NAMES.get(destination, destination)} on {target_date.strftime("%B %d")}',
            }

        # If flight selected and name provided, create booking
        if selected_flight_id and first_name and last_name:
            import secrets
            confirmation_code = ''.join(secrets.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789') for _ in range(6))

            selected = next((f for f in flights if f.get('id') == selected_flight_id), flights[0])
            dep_time = parse(selected['departure_time'])
            origin_city = CITY_NAMES.get(selected['origin'], selected['origin'])
            dest_city = CITY_NAMES.get(selected['destination'], selected['destination'])

            # Send confirmation email if email provided
            email_sent = False
            if email:
                try:
                    flight_details = [{
                        'flight_number': selected['flight_number'],
                        'origin': origin_city,
                        'destination': dest_city,
                        'departure_time': selected['departure_time'],
                        'arrival_time': selected.get('arrival_time', selected['departure_time']),
                        'gate': selected.get('gate', 'TBD'),
                        'seat': 'Will be assigned at check-in',
                    }]
                    resend_service.send_booking_confirmation(
                        to_email=email,
                        passenger_name=f'{first_name} {last_name}',
                        confirmation_code=confirmation_code,
                        flight_details=flight_details,
                        language='en'
                    )
                    email_sent = True
                    logger.info(f"Booking confirmation email sent to {email}")
                except Exception as e:
                    logger.error(f"Failed to send booking confirmation email: {e}")

            # Build message with email confirmation (only mention if user provided email)
            message = f'Booking confirmed! Your confirmation code is {confirmation_code}'
            if email_sent and user_provided_email:
                message += f'. A confirmation email has been sent to {user_provided_email}'

            return {
                'success': True,
                'booked': True,
                'confirmation_code': confirmation_code,
                'passenger_name': f'{first_name} {last_name}',
                'flight_number': selected['flight_number'],
                'origin': selected['origin'],
                'origin_city': origin_city,
                'destination': selected['destination'],
                'destination_city': dest_city,
                'departure_date': dep_time.strftime('%B %d, %Y'),
                'departure_time': dep_time.strftime('%I:%M %p'),
                'email_sent': email_sent,
                'message': message,
            }

        # Return flight options
        options = []
        for flight in flights[:3]:
            dep_time = parse(flight['departure_time'])
            options.append({
                'id': flight.get('id', flight['flight_number']),
                'flight_number': flight['flight_number'],
                'departure_time': dep_time.strftime('%I:%M %p'),
                'price': flight.get('price', '$249'),
            })

        return {
            'success': True,
            'booked': False,
            'options': options,
            'needs': ['selected_flight_id', 'first_name', 'last_name'] if not (first_name and last_name) else ['selected_flight_id'],
            'message': f'Found {len(options)} flights. The earliest is at {options[0]["departure_time"]} for {options[0]["price"]}.',
        }

    def _fn_get_flight_options(self, args: Dict[str, Any], call_id: str) -> Dict[str, Any]:
        """
        Search for available flights.

        Args:
            origin: Origin airport code or city
            destination: Destination airport code or city
            date: Travel date

        Returns:
            List of available flights
        """
        origin = args.get('origin', '').upper()
        destination = args.get('destination', '').upper()
        date = args.get('date', '')

        # Map city names to codes
        city_to_code = {v.upper(): k for k, v in CITY_NAMES.items()}
        if origin in city_to_code:
            origin = city_to_code[origin]
        if destination in city_to_code:
            destination = city_to_code[destination]

        if not date:
            date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        from dateutil.parser import parse
        try:
            if 'tomorrow' in date.lower():
                target_date = datetime.now() + timedelta(days=1)
            else:
                target_date = parse(date)
        except:
            target_date = datetime.now() + timedelta(days=1)

        flights = get_alternative_flights(origin, destination, target_date.strftime('%Y-%m-%d'))

        if not flights:
            return {
                'success': True,
                'found': False,
                'message': f'No flights available from {origin} to {destination} on {target_date.strftime("%B %d")}',
            }

        options = []
        for flight in flights[:5]:
            dep_time = parse(flight['departure_time'])
            options.append({
                'id': flight.get('id', flight['flight_number']),
                'flight_number': flight['flight_number'],
                'departure_time': dep_time.strftime('%I:%M %p'),
                'arrival_time': parse(flight['arrival_time']).strftime('%I:%M %p'),
                'price': flight.get('price', '$249'),
            })

        return {
            'success': True,
            'found': True,
            'count': len(options),
            'options': options,
            'date': target_date.strftime('%B %d'),
        }

    def _fn_get_reservation_status(self, args: Dict[str, Any], call_id: str) -> Dict[str, Any]:
        """Get the status of a reservation."""
        code = args.get('confirmation_code', '').upper().strip()

        result = self._fn_lookup_reservation({'confirmation_code': code}, call_id)

        if result.get('found'):
            result['status'] = 'confirmed'
            result['message'] = f"Your flight is confirmed for {result.get('departure_date')} at {result.get('departure_time')}"

        return result


# Singleton instance
retell_webhook_handler = RetellWebhookHandler()


# Function definitions for Retell agent configuration
RETELL_FUNCTION_DEFINITIONS = [
    {
        "name": "lookup_reservation",
        "description": "Look up a flight reservation by confirmation code. Use this when the customer provides their confirmation code.",
        "parameters": {
            "type": "object",
            "properties": {
                "confirmation_code": {
                    "type": "string",
                    "description": "The 6-character confirmation code (e.g., DEMO123, ABC456)"
                }
            },
            "required": ["confirmation_code"]
        }
    },
    {
        "name": "change_flight",
        "description": "Change an existing flight reservation to a new date. Use after looking up the reservation.",
        "parameters": {
            "type": "object",
            "properties": {
                "confirmation_code": {
                    "type": "string",
                    "description": "The confirmation code of the reservation to change"
                },
                "new_date": {
                    "type": "string",
                    "description": "The new date for the flight (e.g., 'tomorrow', 'January 26', 'next Saturday')"
                },
                "preferred_time": {
                    "type": "string",
                    "description": "Optional time preference: 'morning', 'afternoon', or 'evening'"
                },
                "selected_flight_id": {
                    "type": "string",
                    "description": "The ID of the selected flight option (after showing options)"
                }
            },
            "required": ["confirmation_code", "new_date"]
        }
    },
    {
        "name": "create_booking",
        "description": "Create a new flight booking. Collect origin, destination, date, passenger name, and optionally email for confirmation. After a successful booking, a confirmation email will be sent if email is provided.",
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "string",
                    "description": "Origin city or airport code (e.g., 'Dallas', 'DFW')"
                },
                "destination": {
                    "type": "string",
                    "description": "Destination city or airport code (e.g., 'Chicago', 'ORD')"
                },
                "date": {
                    "type": "string",
                    "description": "Travel date (e.g., 'tomorrow', 'next Tuesday', 'January 28')"
                },
                "first_name": {
                    "type": "string",
                    "description": "Passenger's first name"
                },
                "last_name": {
                    "type": "string",
                    "description": "Passenger's last name"
                },
                "email": {
                    "type": "string",
                    "description": "Passenger's email address for booking confirmation (optional but recommended)"
                },
                "selected_flight_id": {
                    "type": "string",
                    "description": "The ID of the selected flight option"
                }
            },
            "required": ["origin", "destination", "date"]
        }
    },
    {
        "name": "get_flight_options",
        "description": "Search for available flights between two cities on a specific date.",
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "string",
                    "description": "Origin city or airport code"
                },
                "destination": {
                    "type": "string",
                    "description": "Destination city or airport code"
                },
                "date": {
                    "type": "string",
                    "description": "Travel date"
                }
            },
            "required": ["origin", "destination"]
        }
    },
    {
        "name": "get_reservation_status",
        "description": "Check the status of an existing reservation.",
        "parameters": {
            "type": "object",
            "properties": {
                "confirmation_code": {
                    "type": "string",
                    "description": "The confirmation code to check"
                }
            },
            "required": ["confirmation_code"]
        }
    }
]
