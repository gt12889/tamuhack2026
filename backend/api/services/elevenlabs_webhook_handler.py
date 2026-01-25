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
    - get_directions: Get directions to airport amenities (restrooms, food, etc.)
    - create_family_helper_link: Create a link for family to track passenger location
    - check_flight_delays: Check if a flight has delays or cancellations
    - get_gate_directions: Get directions to a specific gate
    - request_wheelchair: Request wheelchair assistance
    - add_bags: Add checked bags to a reservation
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
            'get_directions': self._fn_get_directions,
            'create_family_helper_link': self._fn_create_family_helper_link,
            'check_flight_delays': self._fn_check_flight_delays,
            'get_gate_directions': self._fn_get_gate_directions,
            'request_wheelchair': self._fn_request_wheelchair,
            'add_bags': self._fn_add_bags,
        }

        handler = function_handlers.get(tool_name)
        if handler:
            result = handler(parameters)
            
            # Build response with spoken_summary/spoken_response at top level for easy access
            response = {
                'success': True,
                'tool_name': tool_name,
                'result': result,
            }
            
            # If result has spoken_summary or spoken_response, include it at top level
            # This makes it easier for the agent to access
            if isinstance(result, dict):
                if 'spoken_summary' in result:
                    response['spoken_summary'] = result['spoken_summary']
                if 'spoken_response' in result:
                    response['spoken_response'] = result['spoken_response']
            
            return response

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
                    gate = first_flight.get('gate', 'TBD')
                    seat = first_flight.get('seat', 'Not assigned')
                    status = first_flight.get('status', 'scheduled')

                    # Create a spoken summary the agent should read
                    spoken_summary = (
                        f"I found your reservation, {passenger['first_name']}. "
                        f"You're booked on flight {first_flight['flight_number']} "
                        f"from {origin_city} to {dest_city}, "
                        f"departing {dep_time.strftime('%B %d')} at {dep_time.strftime('%I:%M %p')}. "
                    )
                    if gate and gate != 'TBD':
                        spoken_summary += f"Your gate is {gate}. "
                    if seat and seat != 'Not assigned':
                        spoken_summary += f"You're in seat {seat}. "
                    spoken_summary += "How can I help you with this flight?"

                    return {
                        'success': True,
                        'found': True,
                        'confirmation_code': code,
                        'passenger_name': f"{passenger['first_name']} {passenger['last_name']}",
                        'passenger_first_name': passenger['first_name'],
                        'origin': first_flight['origin'],
                        'origin_city': origin_city,
                        'destination': first_flight['destination'],
                        'destination_city': dest_city,
                        'departure_date': dep_time.strftime('%B %d'),
                        'departure_time': dep_time.strftime('%I:%M %p'),
                        'flight_number': first_flight['flight_number'],
                        'gate': gate,
                        'seat': seat,
                        'status': status,
                        'spoken_summary': spoken_summary,
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
                flight = segment.flight
                passenger = reservation.passenger
                origin_city = CITY_NAMES.get(flight.origin, flight.origin)
                dest_city = CITY_NAMES.get(flight.destination, flight.destination)
                gate = flight.gate or 'TBD'
                seat = segment.seat or 'Not assigned'

                # Create spoken summary for the agent
                spoken_summary = (
                    f"I found your reservation, {passenger.first_name}. "
                    f"You're booked on flight {flight.flight_number} "
                    f"from {origin_city} to {dest_city}, "
                    f"departing {flight.departure_time.strftime('%B %d')} at {flight.departure_time.strftime('%I:%M %p')}. "
                )
                if gate and gate != 'TBD':
                    spoken_summary += f"Your gate is {gate}. "
                if seat and seat != 'Not assigned':
                    spoken_summary += f"You're in seat {seat}. "
                spoken_summary += "How can I help you with this flight?"

                return {
                    'success': True,
                    'found': True,
                    'confirmation_code': code,
                    'passenger_name': f"{passenger.first_name} {passenger.last_name}",
                    'passenger_first_name': passenger.first_name,
                    'origin': flight.origin,
                    'origin_city': origin_city,
                    'destination': flight.destination,
                    'destination_city': dest_city,
                    'departure_date': flight.departure_time.strftime('%B %d'),
                    'departure_time': flight.departure_time.strftime('%I:%M %p'),
                    'flight_number': flight.flight_number,
                    'gate': gate,
                    'seat': seat,
                    'status': flight.status,
                    'spoken_summary': spoken_summary,
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

    def _fn_get_directions(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get directions to nearby airport amenities (restrooms, food, water, etc.)

        Args:
            destination_type: Type of place (restroom, food, water, charging, medical, info)
            current_location: Optional current location description (e.g., "Gate B20", "security")
            terminal: Optional terminal (A, B, C, D, E)

        Returns:
            Directions to the nearest matching amenity
        """
        destination_type = args.get('destination_type', '').lower().strip()
        current_location = args.get('current_location', '').lower().strip()
        terminal = args.get('terminal', '').upper().strip()

        # DFW Airport POI data
        pois = {
            'restroom': [
                {'name': 'Restroom near Gate A12', 'terminal': 'A', 'near_gate': 'A12', 'landmark': 'just past security on the right'},
                {'name': 'Restroom near Gate A25', 'terminal': 'A', 'near_gate': 'A25', 'landmark': 'by Starbucks'},
                {'name': 'Restroom near Skylink B', 'terminal': 'B', 'near_gate': 'B15', 'landmark': 'at the bottom of Skylink escalators'},
                {'name': 'Restroom near Gate B20', 'terminal': 'B', 'near_gate': 'B20', 'landmark': 'between Gates B19 and B21'},
                {'name': 'Restroom near Gate B22', 'terminal': 'B', 'near_gate': 'B22', 'landmark': 'just past the gate on your left'},
            ],
            'food': [
                {'name': 'Starbucks', 'terminal': 'A', 'near_gate': 'A22', 'landmark': 'coffee and snacks', 'hours': '5 AM to 9 PM'},
                {'name': "McDonald's", 'terminal': 'A', 'near_gate': 'A15', 'landmark': 'fast food', 'hours': '6 AM to 10 PM'},
                {'name': 'Whataburger', 'terminal': 'B', 'near_gate': 'B17', 'landmark': 'Texas-style burgers', 'hours': '6 AM to 10 PM'},
                {'name': 'Starbucks', 'terminal': 'B', 'near_gate': 'B21', 'landmark': 'coffee and snacks near Gate B21', 'hours': '5 AM to 9 PM'},
            ],
            'water': [
                {'name': 'Water Fountain', 'terminal': 'A', 'near_gate': 'A10', 'landmark': 'bottle refill station post-security'},
                {'name': 'Water Fountain', 'terminal': 'B', 'near_gate': 'B20', 'landmark': 'near the restrooms'},
            ],
            'charging': [
                {'name': 'Charging Station', 'terminal': 'A', 'near_gate': 'A26', 'landmark': 'free USB and outlets'},
                {'name': 'Charging Station', 'terminal': 'B', 'near_gate': 'B22', 'landmark': 'at the gate seating area'},
            ],
            'medical': [
                {'name': 'First Aid Station', 'terminal': 'A', 'near_gate': 'A8', 'landmark': 'staffed 24/7'},
            ],
            'info': [
                {'name': 'Information Desk', 'terminal': 'A', 'near_gate': 'A10', 'landmark': 'airport assistance'},
                {'name': 'Information Desk', 'terminal': 'B', 'near_gate': 'B15', 'landmark': 'near Skylink exit'},
            ],
        }

        # Normalize destination type
        type_aliases = {
            'bathroom': 'restroom',
            'toilet': 'restroom',
            'restrooms': 'restroom',
            'restaurant': 'food',
            'eat': 'food',
            'coffee': 'food',
            'drink': 'water',
            'water fountain': 'water',
            'charge': 'charging',
            'charger': 'charging',
            'phone charger': 'charging',
            'help': 'info',
            'information': 'info',
            'first aid': 'medical',
            'nurse': 'medical',
            'doctor': 'medical',
        }

        normalized_type = type_aliases.get(destination_type, destination_type)

        if normalized_type not in pois:
            return {
                'success': False,
                'error': f"I can help you find restrooms, food, water fountains, charging stations, medical assistance, or information desks. What are you looking for?",
                'available_types': list(pois.keys()),
            }

        options = pois[normalized_type]

        # Filter by terminal if specified
        if terminal:
            options = [p for p in options if p['terminal'] == terminal]

        if not options:
            return {
                'success': False,
                'error': f"I couldn't find a {normalized_type} in Terminal {terminal}. Let me check other terminals.",
            }

        # Pick the most relevant option based on current location
        selected = options[0]

        # If user mentioned a gate, try to find nearest
        if current_location:
            for opt in options:
                if opt.get('near_gate', '').lower() in current_location:
                    selected = opt
                    break
                if opt['terminal'].lower() in current_location:
                    selected = opt

        # Build directions
        directions = f"The nearest {normalized_type} is {selected['name']} in Terminal {selected['terminal']}, near Gate {selected['near_gate']}. "
        directions += f"Look for it {selected['landmark']}."

        if selected.get('hours'):
            directions += f" It's open from {selected['hours']}."

        return {
            'success': True,
            'destination_type': normalized_type,
            'name': selected['name'],
            'terminal': selected['terminal'],
            'near_gate': selected['near_gate'],
            'directions': directions,
            'landmark': selected['landmark'],
        }

    def _fn_create_family_helper_link(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a family helper link so a family member can track and assist the passenger.

        Args:
            confirmation_code: The reservation confirmation code
            passenger_phone: Optional phone number to send the link to

        Returns:
            The helper link URL
        """
        code = args.get('confirmation_code', '').upper().strip()

        if not code:
            return {
                'success': False,
                'error': 'I need your confirmation code to create a helper link.',
                'spoken_response': 'I need your confirmation code first to create a family helper link. What is your confirmation code?',
            }

        # Generate a helper link ID
        import secrets
        link_id = ''.join(secrets.choice('abcdefghjkmnpqrstuvwxyz23456789') for _ in range(8))

        # In production, this would save to the database
        helper_url = f"https://aa-voice.vercel.app/help/{link_id}"

        return {
            'success': True,
            'helper_link': helper_url,
            'link_id': link_id,
            'confirmation_code': code,
            'spoken_response': f"I've created a family helper link. You can share this link with a family member: {helper_url}. They'll be able to see your flight details and location to help guide you through the airport. Would you like me to explain how it works?",
        }

    def _fn_check_flight_delays(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if a flight has any delays or schedule changes.

        Args:
            confirmation_code: The reservation confirmation code
            flight_number: Or the flight number directly

        Returns:
            Flight status and any delay information
        """
        code = args.get('confirmation_code', '').upper().strip()
        flight_number = args.get('flight_number', '').upper().strip()

        # Look up the reservation first
        if code:
            demo_reservations = get_demo_reservations()
            for res_data in demo_reservations:
                if res_data['confirmation_code'].upper() == code:
                    flight = res_data['flights'][0] if res_data['flights'] else None
                    if flight:
                        status = flight.get('status', 'on_time')
                        delay_minutes = flight.get('delay_minutes', 0)

                        if status == 'delayed' or delay_minutes > 0:
                            return {
                                'success': True,
                                'flight_number': flight['flight_number'],
                                'status': 'delayed',
                                'delay_minutes': delay_minutes,
                                'new_departure_time': flight.get('new_departure_time'),
                                'spoken_response': f"Your flight {flight['flight_number']} is currently delayed by {delay_minutes} minutes. The new departure time is {flight.get('new_departure_time', 'being updated')}. I apologize for the inconvenience.",
                            }
                        elif status == 'cancelled':
                            return {
                                'success': True,
                                'flight_number': flight['flight_number'],
                                'status': 'cancelled',
                                'spoken_response': f"I'm sorry, but your flight {flight['flight_number']} has been cancelled. Would you like me to help you find an alternative flight?",
                            }
                        else:
                            return {
                                'success': True,
                                'flight_number': flight['flight_number'],
                                'status': 'on_time',
                                'spoken_response': f"Good news! Your flight {flight['flight_number']} is currently on time and scheduled to depart as planned.",
                            }

        return {
            'success': True,
            'status': 'on_time',
            'spoken_response': "Your flight is currently on time with no delays reported.",
        }

    def _fn_get_gate_directions(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get directions to a specific gate.

        Args:
            gate: The gate number (e.g., "B22")
            current_location: Where the passenger currently is

        Returns:
            Step-by-step directions to the gate
        """
        gate = args.get('gate', '').upper().strip()
        current_location = args.get('current_location', '').lower().strip()

        if not gate:
            return {
                'success': False,
                'error': 'Which gate do you need directions to?',
            }

        # Parse terminal from gate
        terminal = gate[0] if gate else 'B'

        # DFW-specific directions
        directions_map = {
            'A': {
                'from_entrance': 'From the entrance, go through security, then follow signs to your gate number.',
                'from_security': 'After security, turn right and follow the concourse. Gates are numbered sequentially.',
            },
            'B': {
                'from_entrance': 'From Terminal A, take the Skylink train to Terminal B, then follow signs to your gate.',
                'from_security': 'Take the Skylink train from Terminal A to Terminal B. Exit and turn left for gates B15-B30.',
                'from_skylink': 'Exit the Skylink, take the escalator down, turn left and follow signs to your gate.',
            },
        }

        term_directions = directions_map.get(terminal, directions_map['B'])

        if 'security' in current_location:
            directions = term_directions.get('from_security', term_directions.get('from_entrance'))
        elif 'skylink' in current_location:
            directions = term_directions.get('from_skylink', term_directions.get('from_security'))
        else:
            directions = term_directions.get('from_entrance')

        return {
            'success': True,
            'gate': gate,
            'terminal': terminal,
            'directions': directions,
            'spoken_response': f"To get to Gate {gate}: {directions} Look for the gate numbers on the signs above. Gate {gate} should take about 10 to 15 minutes to reach.",
        }

    def _fn_request_wheelchair(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Request wheelchair assistance for the passenger.

        Args:
            confirmation_code: The reservation confirmation code
            pickup_location: Where to send the wheelchair

        Returns:
            Confirmation of wheelchair request
        """
        code = args.get('confirmation_code', '').upper().strip()
        pickup_location = args.get('pickup_location', 'current gate')

        if not code:
            return {
                'success': False,
                'error': 'I need your confirmation code to request wheelchair assistance.',
            }

        return {
            'success': True,
            'requested': True,
            'confirmation_code': code,
            'pickup_location': pickup_location,
            'estimated_wait': '10-15 minutes',
            'spoken_response': f"I've requested wheelchair assistance for you. Someone will meet you at {pickup_location} within 10 to 15 minutes. Please stay where you are and they'll come to you. Is there anything else I can help with?",
        }

    def _fn_add_bags(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add checked bags to the reservation.

        Args:
            confirmation_code: The reservation confirmation code
            bag_count: Number of bags to add

        Returns:
            Confirmation and any fees
        """
        code = args.get('confirmation_code', '').upper().strip()
        bag_count = args.get('bag_count', 1)

        if not code:
            return {
                'success': False,
                'error': 'I need your confirmation code to add bags.',
            }

        try:
            bag_count = int(bag_count)
        except:
            bag_count = 1

        # Standard bag fees
        fee_per_bag = 35
        total_fee = bag_count * fee_per_bag

        return {
            'success': True,
            'confirmation_code': code,
            'bags_added': bag_count,
            'fee_per_bag': f'${fee_per_bag}',
            'total_fee': f'${total_fee}',
            'spoken_response': f"I've added {bag_count} checked bag{'s' if bag_count > 1 else ''} to your reservation. The fee is ${fee_per_bag} per bag, so your total is ${total_fee}. You can pay at the check-in counter or kiosk. Anything else I can help with?",
        }


# Singleton instance
elevenlabs_webhook_handler = ElevenLabsWebhookHandler()


# Server tool definitions for ElevenLabs Conversational AI agent configuration
ELEVENLABS_SERVER_TOOL_DEFINITIONS = [
    {
        "name": "lookup_reservation",
        "description": "Look up a flight reservation by confirmation code. Use this when the customer provides their confirmation code. IMPORTANT: After calling this tool, you MUST read back the flight details to the user including passenger name, flight number, origin, destination, departure date/time, gate, and seat. Use the 'spoken_summary' field from the result if provided.",
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
    },
    {
        "name": "get_directions",
        "description": "Get directions to nearby airport amenities like restrooms, food, water fountains, charging stations, medical assistance, or information desks. Use this when the passenger asks where to find something in the airport. IMPORTANT: After calling this tool, you MUST read back the directions to the user including the location, terminal, and gate information.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination_type": {
                    "type": "string",
                    "description": "Type of place to find: 'restroom', 'food', 'water', 'charging', 'medical', or 'info'"
                },
                "current_location": {
                    "type": "string",
                    "description": "The passenger's current location if known (e.g., 'Gate B20', 'security', 'Terminal A')"
                },
                "terminal": {
                    "type": "string",
                    "description": "The terminal to search in (A, B, C, D, or E)"
                }
            },
            "required": ["destination_type"]
        }
    },
    {
        "name": "create_family_helper_link",
        "description": "Create a helper link that can be shared with a family member so they can track the passenger's location in the airport and help guide them. Use this when the passenger mentions they're traveling alone, need help navigating, or want a family member to be able to see their location. IMPORTANT: After calling this tool, you MUST provide the helper link URL to the user and explain how to share it. Use the 'spoken_response' field from the result if provided.",
        "parameters": {
            "type": "object",
            "properties": {
                "confirmation_code": {
                    "type": "string",
                    "description": "The passenger's confirmation code"
                }
            },
            "required": ["confirmation_code"]
        }
    },
    {
        "name": "check_flight_delays",
        "description": "Check if a flight has any delays, cancellations, or schedule changes. Use this when the passenger asks about delays or if their flight is on time. IMPORTANT: After calling this tool, you MUST read back the flight status to the user. Use the 'spoken_response' field from the result if provided.",
        "parameters": {
            "type": "object",
            "properties": {
                "confirmation_code": {
                    "type": "string",
                    "description": "The passenger's confirmation code"
                },
                "flight_number": {
                    "type": "string",
                    "description": "Or the flight number directly (e.g., AA123)"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_gate_directions",
        "description": "Get step-by-step directions to a specific gate at DFW airport. Use this when the passenger needs to find their gate. IMPORTANT: After calling this tool, you MUST read back the step-by-step directions to the user including Skylink/train information and estimated time. Use the 'spoken_response' field from the result if provided.",
        "parameters": {
            "type": "object",
            "properties": {
                "gate": {
                    "type": "string",
                    "description": "The gate number (e.g., 'B22', 'A15')"
                },
                "current_location": {
                    "type": "string",
                    "description": "Where the passenger currently is (e.g., 'security', 'entrance', 'Terminal A')"
                }
            },
            "required": ["gate"]
        }
    },
    {
        "name": "request_wheelchair",
        "description": "Request wheelchair assistance for a passenger who needs mobility help. Use this when the passenger mentions difficulty walking, needs wheelchair assistance, or requests help getting around the airport. IMPORTANT: After calling this tool, you MUST confirm to the user that wheelchair assistance has been requested and provide the estimated wait time. Use the 'spoken_response' field from the result if provided.",
        "parameters": {
            "type": "object",
            "properties": {
                "confirmation_code": {
                    "type": "string",
                    "description": "The passenger's confirmation code"
                },
                "pickup_location": {
                    "type": "string",
                    "description": "Where to send the wheelchair (e.g., 'Gate B22', 'entrance', 'current location')"
                }
            },
            "required": ["confirmation_code"]
        }
    },
    {
        "name": "add_bags",
        "description": "Add checked bags to the passenger's reservation. Use this when the passenger wants to check bags or asks about adding luggage to their flight.",
        "parameters": {
            "type": "object",
            "properties": {
                "confirmation_code": {
                    "type": "string",
                    "description": "The passenger's confirmation code"
                },
                "bag_count": {
                    "type": "integer",
                    "description": "Number of bags to add (default 1)"
                }
            },
            "required": ["confirmation_code"]
        }
    }
]
