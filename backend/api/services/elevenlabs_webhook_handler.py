"""ElevenLabs Conversational AI webhook handler for processing server tool calls."""

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

logger = logging.getLogger(__name__)


class ElevenLabsWebhookHandler:
    """
    Handles ElevenLabs Conversational AI server tool callbacks.

    ElevenLabs can call these server tools during a conversation:
    - lookup_reservation: Find a reservation by confirmation code
    - change_flight: Change a flight to a new date
    - create_booking: Create a new flight booking
    - get_flight_options: Search for available flights
    - get_reservation_status: Check reservation status
    """

    def __init__(self):
        self.api_key = getattr(settings, 'ELEVENLABS_API_KEY', '')

    def handle_server_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main handler for server tool invocations from ElevenLabs.

        Args:
            tool_name: Name of the tool being called
            parameters: Parameters passed to the tool

        Returns:
            Tool result to be sent back to ElevenLabs
        """
        logger.info(f"ElevenLabs server tool call: {tool_name} with params: {parameters}")

        # Route to appropriate function handler
        function_handlers = {
            'lookup_reservation': self._fn_lookup_reservation,
            'change_flight': self._fn_change_flight,
            'create_booking': self._fn_create_booking,
            'get_flight_options': self._fn_get_flight_options,
            'get_reservation_status': self._fn_get_reservation_status,
        }

        handler = function_handlers.get(tool_name)
        if handler:
            result = handler(parameters)
            return {
                'success': True,
                'tool_name': tool_name,
                'result': result,
            }

        return {
            'success': False,
            'error': f'Unknown tool: {tool_name}',
        }

    # ==================== Function Implementations ====================

    def _fn_lookup_reservation(self, args: Dict[str, Any]) -> Dict[str, Any]:
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

    def _fn_change_flight(self, args: Dict[str, Any]) -> Dict[str, Any]:
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

    def _fn_create_booking(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new flight booking.

        Args:
            origin: Origin airport code or city
            destination: Destination airport code or city
            date: Departure date
            first_name: Passenger first name
            last_name: Passenger last name
            selected_flight_id: The selected flight option

        Returns:
            Booking confirmation or error
        """
        origin = args.get('origin', '').upper()
        destination = args.get('destination', '').upper()
        date = args.get('date', '')
        first_name = args.get('first_name', '')
        last_name = args.get('last_name', '')
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

            return {
                'success': True,
                'booked': True,
                'confirmation_code': confirmation_code,
                'passenger_name': f'{first_name} {last_name}',
                'flight_number': selected['flight_number'],
                'origin': selected['origin'],
                'origin_city': CITY_NAMES.get(selected['origin'], selected['origin']),
                'destination': selected['destination'],
                'destination_city': CITY_NAMES.get(selected['destination'], selected['destination']),
                'departure_date': dep_time.strftime('%B %d, %Y'),
                'departure_time': dep_time.strftime('%I:%M %p'),
                'message': f'Booking confirmed! Your confirmation code is {confirmation_code}',
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

    def _fn_get_flight_options(self, args: Dict[str, Any]) -> Dict[str, Any]:
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

    def _fn_get_reservation_status(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get the status of a reservation."""
        code = args.get('confirmation_code', '').upper().strip()

        result = self._fn_lookup_reservation({'confirmation_code': code})

        if result.get('found'):
            result['status'] = 'confirmed'
            result['message'] = f"Your flight is confirmed for {result.get('departure_date')} at {result.get('departure_time')}"

        return result


# Singleton instance
elevenlabs_webhook_handler = ElevenLabsWebhookHandler()


# Server tool definitions for ElevenLabs Conversational AI agent configuration
ELEVENLABS_SERVER_TOOL_DEFINITIONS = [
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
        "description": "Create a new flight booking. Collect origin, destination, date, and passenger name.",
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
