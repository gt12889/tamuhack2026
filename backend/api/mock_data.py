"""Mock data for Elder Strolls demo.

Uses AA Flight-Engine API when available, falls back to hardcoded data.
Flight-Engine: https://github.com/AmericanAirlines/Flight-Engine
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from django.utils import timezone

logger = logging.getLogger(__name__)

# Try to import Flight-Engine service
try:
    from .services.flight_engine_service import flight_engine
    FLIGHT_ENGINE_AVAILABLE = True
except ImportError:
    FLIGHT_ENGINE_AVAILABLE = False
    flight_engine = None


def get_demo_reservations() -> List[Dict[str, Any]]:
    """
    Return mock reservation data for the demo.

    These are pre-seeded reservations that users can look up
    with confirmation codes like DEMO123.
    """
    now = timezone.now()

    # Base reservations (always available)
    # NOTE: confirmation_code max_length=6 in database schema
    reservations = [
        {
            # Primary demo reservation: PIT -> DFW, Monday January 19, 2026
            'confirmation_code': 'CZYBYU',
            'passenger': {
                'first_name': 'Margaret',
                'last_name': 'Johnson',
                'email': 'margaret.johnson@example.com',
                'phone': '214-555-0123',
                'language_preference': 'en',
            },
            'flights': [
                {
                    'flight_number': 'AA1845',
                    'origin': 'PIT',
                    'destination': 'DFW',
                    'departure_time': '2026-01-19T07:06:00-05:00',  # 7:06 AM EST
                    'arrival_time': '2026-01-19T09:50:00-06:00',  # 9:50 AM CST
                    'gate': 'B22',
                    'seat': '14A',
                    'status': 'scheduled',
                }
            ],
        },
        {
            'confirmation_code': 'TEST45',
            'passenger': {
                'first_name': 'Robert',
                'last_name': 'Smith',
                'email': 'robert.smith@example.com',
                'phone': '310-555-0456',
                'language_preference': 'en',
            },
            'flights': [
                {
                    'flight_number': 'AA567',
                    'origin': 'LAX',
                    'destination': 'JFK',
                    'departure_time': (now + timedelta(days=2, hours=9)).isoformat(),
                    'arrival_time': (now + timedelta(days=2, hours=17, minutes=30)).isoformat(),
                    'gate': 'B7',
                    'seat': '22C',
                    'status': 'scheduled',
                },
                {
                    'flight_number': 'AA890',
                    'origin': 'JFK',
                    'destination': 'MIA',
                    'departure_time': (now + timedelta(days=2, hours=19)).isoformat(),
                    'arrival_time': (now + timedelta(days=2, hours=22, minutes=15)).isoformat(),
                    'gate': 'C3',
                    'seat': '8F',
                    'status': 'scheduled',
                }
            ],
        },
        {
            'confirmation_code': 'ABUEL1',
            'passenger': {
                'first_name': 'Maria',
                'last_name': 'Garcia',
                'email': 'maria.garcia@example.com',
                'phone': '305-555-0789',
                'language_preference': 'es',
            },
            'flights': [
                {
                    'flight_number': 'AA2345',
                    'origin': 'MIA',
                    'destination': 'DFW',
                    'departure_time': (now + timedelta(days=3, hours=11)).isoformat(),
                    'arrival_time': (now + timedelta(days=3, hours=13, minutes=45)).isoformat(),
                    'gate': 'D15',
                    'seat': '6A',
                    'status': 'scheduled',
                }
            ],
        },
        {
            'confirmation_code': 'SENR02',
            'passenger': {
                'first_name': 'William',
                'last_name': 'Thompson',
                'email': 'william.thompson@example.com',
                'phone': '773-555-0234',
                'language_preference': 'en',
            },
            'flights': [
                {
                    'flight_number': 'AA789',
                    'origin': 'ORD',
                    'destination': 'DFW',
                    'departure_time': (now + timedelta(days=1, hours=8)).isoformat(),
                    'arrival_time': (now + timedelta(days=1, hours=10, minutes=30)).isoformat(),
                    'gate': 'K8',
                    'seat': '3C',
                    'status': 'scheduled',
                }
            ],
        },
        {
            'confirmation_code': 'FAML03',
            'passenger': {
                'first_name': 'Dorothy',
                'last_name': 'Williams',
                'email': 'dorothy.williams@example.com',
                'phone': '602-555-0567',
                'language_preference': 'en',
            },
            'flights': [
                {
                    'flight_number': 'AA456',
                    'origin': 'PHX',
                    'destination': 'LAX',
                    'departure_time': (now + timedelta(days=4, hours=15)).isoformat(),
                    'arrival_time': (now + timedelta(days=4, hours=16, minutes=15)).isoformat(),
                    'gate': 'E22',
                    'seat': '12B',
                    'status': 'scheduled',
                },
                {
                    'flight_number': 'AA1122',
                    'origin': 'LAX',
                    'destination': 'HNL',
                    'departure_time': (now + timedelta(days=4, hours=18)).isoformat(),
                    'arrival_time': (now + timedelta(days=4, hours=21, minutes=30)).isoformat(),
                    'gate': 'T4',
                    'seat': '12B',
                    'status': 'scheduled',
                }
            ],
        },
    ]

    return reservations


def get_alternative_flights(
    origin: str,
    destination: str,
    date: str,
    use_flight_engine: bool = True
) -> List[Dict[str, Any]]:
    """
    Get alternative flight options for rebooking.

    Tries Flight-Engine API first, falls back to generated mock data.

    Args:
        origin: Origin airport code (e.g., 'DFW')
        destination: Destination airport code (e.g., 'ORD')
        date: Target date in YYYY-MM-DD or ISO format
        use_flight_engine: Whether to try Flight-Engine API

    Returns:
        List of flight option dicts
    """
    # Try Flight-Engine API first
    if use_flight_engine and FLIGHT_ENGINE_AVAILABLE and flight_engine:
        try:
            # Parse date if it's ISO format
            if 'T' in date:
                date = date.split('T')[0]

            flights = flight_engine.get_alternative_flights_formatted(
                origin=origin,
                destination=destination,
                date=date
            )

            if flights:
                logger.info(f"Got {len(flights)} flights from Flight-Engine API")
                return flights

        except Exception as e:
            logger.warning(f"Flight-Engine API failed, using fallback: {e}")

    # Fallback to generated mock data
    return _generate_mock_flights(origin, destination, date)


def _generate_mock_flights(
    origin: str,
    destination: str,
    date: str
) -> List[Dict[str, Any]]:
    """Generate mock flight options when Flight-Engine is unavailable."""
    from dateutil.parser import parse

    try:
        if 'T' in date:
            target_date = parse(date)
        else:
            target_date = parse(date)
    except:
        target_date = timezone.now() + timedelta(days=1)

    # Make target_date timezone aware if it isn't
    if target_date.tzinfo is None:
        target_date = timezone.make_aware(target_date)

    origin_city = CITY_NAMES.get(origin, origin)
    dest_city = CITY_NAMES.get(destination, destination)

    # Generate 3 alternative flights
    return [
        {
            'id': f'mock-{origin}-{destination}-1',
            'flight_number': f'AA{1000 + abs(hash(f"{origin}{destination}1")) % 9000}',
            'origin': origin,
            'destination': destination,
            'origin_city': origin_city,
            'destination_city': dest_city,
            'departure_time': target_date.replace(hour=8, minute=0).isoformat(),
            'arrival_time': (target_date.replace(hour=8, minute=0) + timedelta(hours=3)).isoformat(),
            'gate': 'TBD',
            'status': 'scheduled',
            'duration': '3h 0m',
        },
        {
            'id': f'mock-{origin}-{destination}-2',
            'flight_number': f'AA{1000 + abs(hash(f"{origin}{destination}2")) % 9000}',
            'origin': origin,
            'destination': destination,
            'origin_city': origin_city,
            'destination_city': dest_city,
            'departure_time': target_date.replace(hour=14, minute=0).isoformat(),
            'arrival_time': (target_date.replace(hour=14, minute=0) + timedelta(hours=3)).isoformat(),
            'gate': 'TBD',
            'status': 'scheduled',
            'duration': '3h 0m',
        },
        {
            'id': f'mock-{origin}-{destination}-3',
            'flight_number': f'AA{1000 + abs(hash(f"{origin}{destination}3")) % 9000}',
            'origin': origin,
            'destination': destination,
            'origin_city': origin_city,
            'destination_city': dest_city,
            'departure_time': target_date.replace(hour=19, minute=0).isoformat(),
            'arrival_time': (target_date.replace(hour=19, minute=0) + timedelta(hours=3)).isoformat(),
            'gate': 'TBD',
            'status': 'scheduled',
            'duration': '3h 0m',
        },
    ]


def get_flights_for_date(date: str) -> List[Dict[str, Any]]:
    """
    Get all flights for a specific date using Flight-Engine.

    Args:
        date: Date in YYYY-MM-DD format

    Returns:
        List of flight dicts
    """
    if FLIGHT_ENGINE_AVAILABLE and flight_engine:
        try:
            flights = flight_engine.get_flights(date=date)
            return [flight_engine.format_flight_for_frontend(f) for f in flights]
        except Exception as e:
            logger.warning(f"Flight-Engine API failed: {e}")

    return []


def get_airport_info(code: str) -> Optional[Dict[str, Any]]:
    """
    Get airport information.

    Args:
        code: 3-letter IATA airport code

    Returns:
        Airport dict or None
    """
    if FLIGHT_ENGINE_AVAILABLE and flight_engine:
        try:
            return flight_engine.get_airport(code)
        except Exception as e:
            logger.warning(f"Flight-Engine API failed: {e}")

    # Fallback to basic info
    if code.upper() in CITY_NAMES:
        return {
            'code': code.upper(),
            'city': CITY_NAMES[code.upper()],
        }

    return None


def get_all_airports() -> List[Dict[str, Any]]:
    """
    Get all supported airports.

    Returns:
        List of airport dicts
    """
    if FLIGHT_ENGINE_AVAILABLE and flight_engine:
        try:
            return flight_engine.get_all_airports()
        except Exception as e:
            logger.warning(f"Flight-Engine API failed: {e}")

    # Fallback to basic list
    return [{'code': code, 'city': city} for code, city in CITY_NAMES.items()]


# City name mappings for natural language understanding
AIRPORT_CODES = {
    'dallas': 'DFW',
    'dfw': 'DFW',
    'dallas fort worth': 'DFW',
    'chicago': 'ORD',
    'ord': 'ORD',
    "o'hare": 'ORD',
    'los angeles': 'LAX',
    'lax': 'LAX',
    'la': 'LAX',
    'new york': 'JFK',
    'jfk': 'JFK',
    'nyc': 'JFK',
    'miami': 'MIA',
    'mia': 'MIA',
    'phoenix': 'PHX',
    'phx': 'PHX',
    'honolulu': 'HNL',
    'hawaii': 'HNL',
    'hnl': 'HNL',
    'boston': 'BOS',
    'bos': 'BOS',
    'san francisco': 'SFO',
    'sfo': 'SFO',
    'seattle': 'SEA',
    'sea': 'SEA',
    'denver': 'DEN',
    'den': 'DEN',
    'atlanta': 'ATL',
    'atl': 'ATL',
    'charlotte': 'CLT',
    'clt': 'CLT',
    'philadelphia': 'PHL',
    'phl': 'PHL',
    'washington': 'DCA',
    'dca': 'DCA',
    'reagan': 'DCA',
    'pittsburgh': 'PIT',
    'pit': 'PIT',
}

CITY_NAMES = {
    'DFW': 'Dallas',
    'ORD': 'Chicago',
    'LAX': 'Los Angeles',
    'JFK': 'New York',
    'MIA': 'Miami',
    'PHX': 'Phoenix',
    'HNL': 'Honolulu',
    'BOS': 'Boston',
    'SFO': 'San Francisco',
    'SEA': 'Seattle',
    'DEN': 'Denver',
    'ATL': 'Atlanta',
    'CLT': 'Charlotte',
    'PHL': 'Philadelphia',
    'DCA': 'Washington D.C.',
    'PIT': 'Pittsburgh',
}


# ============================================================
# IROP (Irregular Operations) Mock Data
# ============================================================

def get_irop_demo_disruption(confirmation_code: str, flight_number: str = None) -> Optional[Dict[str, Any]]:
    """
    Get mock IROP disruption data for demo purposes.

    Simulates real-world disruption scenarios like:
    - Flight delays (2+ hours)
    - Cancellations
    - Missed connections

    Args:
        confirmation_code: Reservation confirmation code
        flight_number: Optional specific flight to get disruption for

    Returns:
        IROP disruption data or None if no disruption
    """
    now = timezone.now()

    # Demo disruption scenarios based on confirmation code
    irop_scenarios = {
        # Delay scenario - Margaret's flight delayed 2.5 hours
        'CZYBYU': {
            'id': 'irop-delay-001',
            'flight_id': 'flight-czybyu-1',
            'flight_number': 'AA1845',
            'disruption_type': 'delay',
            'severity': 'medium',
            'original_departure_time': '2026-01-19T07:06:00-05:00',
            'new_estimated_departure_time': '2026-01-19T09:36:00-05:00',
            'delay_minutes': 150,
            'message': 'Your flight AA1845 has been delayed by 2 hours 30 minutes due to aircraft maintenance.',
            'rebooking_options': [
                {
                    'option_id': 'rebook-opt-1',
                    'flight_number': 'AA2105',
                    'origin': 'PIT',
                    'destination': 'DFW',
                    'departure_time': '2026-01-19T11:00:00-05:00',
                    'arrival_time': '2026-01-19T13:45:00-06:00',
                    'gate': 'B15',
                    'seat': '12A',
                    'connection_risk': 'low',
                    'is_auto_offered': True,
                    'acceptance_deadline': '2026-01-19T08:30:00-05:00',
                },
                {
                    'option_id': 'rebook-opt-2',
                    'flight_number': 'AA3320',
                    'origin': 'PIT',
                    'destination': 'DFW',
                    'departure_time': '2026-01-19T14:30:00-05:00',
                    'arrival_time': '2026-01-19T17:15:00-06:00',
                    'gate': 'B22',
                    'seat': '8C',
                    'connection_risk': 'low',
                    'is_auto_offered': False,
                    'acceptance_deadline': None,
                },
            ],
            'auto_rebooked_option': {
                'option_id': 'rebook-opt-1',
                'flight_number': 'AA2105',
                'origin': 'PIT',
                'destination': 'DFW',
                'departure_time': '2026-01-19T11:00:00-05:00',
                'arrival_time': '2026-01-19T13:45:00-06:00',
                'gate': 'B15',
                'seat': '12A',
                'connection_risk': 'low',
                'is_auto_offered': True,
                'acceptance_deadline': '2026-01-19T08:30:00-05:00',
            },
            'connection_risks': [],
            'acknowledged': False,
            'acknowledged_at': None,
            'created_at': (now - timedelta(hours=1)).isoformat(),
        },

        # Cancellation scenario with connection at risk
        'TEST45': {
            'id': 'irop-cancel-001',
            'flight_id': 'flight-test45-1',
            'flight_number': 'AA567',
            'disruption_type': 'cancellation',
            'severity': 'high',
            'original_departure_time': (now + timedelta(days=2, hours=9)).isoformat(),
            'new_estimated_departure_time': None,
            'delay_minutes': None,
            'message': 'Your flight AA567 from LAX to JFK has been cancelled due to severe weather.',
            'rebooking_options': [
                {
                    'option_id': 'rebook-cancel-1',
                    'flight_number': 'AA1234',
                    'origin': 'LAX',
                    'destination': 'JFK',
                    'departure_time': (now + timedelta(days=2, hours=11)).isoformat(),
                    'arrival_time': (now + timedelta(days=2, hours=19, minutes=30)).isoformat(),
                    'gate': 'A12',
                    'seat': '15D',
                    'connection_risk': 'high',
                    'is_auto_offered': True,
                    'acceptance_deadline': (now + timedelta(days=2, hours=8)).isoformat(),
                },
                {
                    'option_id': 'rebook-cancel-2',
                    'flight_number': 'AA5678',
                    'origin': 'LAX',
                    'destination': 'JFK',
                    'departure_time': (now + timedelta(days=2, hours=6)).isoformat(),
                    'arrival_time': (now + timedelta(days=2, hours=14, minutes=30)).isoformat(),
                    'gate': 'B5',
                    'seat': '22A',
                    'connection_risk': 'low',
                    'is_auto_offered': False,
                    'acceptance_deadline': None,
                },
            ],
            'auto_rebooked_option': {
                'option_id': 'rebook-cancel-1',
                'flight_number': 'AA1234',
                'origin': 'LAX',
                'destination': 'JFK',
                'departure_time': (now + timedelta(days=2, hours=11)).isoformat(),
                'arrival_time': (now + timedelta(days=2, hours=19, minutes=30)).isoformat(),
                'gate': 'A12',
                'seat': '15D',
                'connection_risk': 'high',
                'is_auto_offered': True,
                'acceptance_deadline': (now + timedelta(days=2, hours=8)).isoformat(),
            },
            'connection_risks': [
                {
                    'connection_flight_number': 'AA890',
                    'origin': 'JFK',
                    'destination': 'MIA',
                    'connection_time_minutes': 30,
                    'minimum_connection_time': 45,
                    'risk_level': 'high',
                    'reason': 'Connection time (30 min) is below minimum required (45 min) at JFK',
                },
            ],
            'acknowledged': False,
            'acknowledged_at': None,
            'created_at': (now - timedelta(hours=2)).isoformat(),
        },

        # Missed connection scenario
        'FAML03': {
            'id': 'irop-missed-001',
            'flight_id': 'flight-faml03-2',
            'flight_number': 'AA1122',
            'disruption_type': 'missed_connection',
            'severity': 'high',
            'original_departure_time': (now + timedelta(days=4, hours=18)).isoformat(),
            'new_estimated_departure_time': None,
            'delay_minutes': None,
            'message': 'You may miss your connecting flight AA1122 from LAX to HNL due to the delay in your first flight.',
            'rebooking_options': [
                {
                    'option_id': 'rebook-miss-1',
                    'flight_number': 'AA8800',
                    'origin': 'LAX',
                    'destination': 'HNL',
                    'departure_time': (now + timedelta(days=4, hours=21)).isoformat(),
                    'arrival_time': (now + timedelta(days=5, hours=0, minutes=30)).isoformat(),
                    'gate': 'T6',
                    'seat': '14B',
                    'connection_risk': 'low',
                    'is_auto_offered': True,
                    'acceptance_deadline': (now + timedelta(days=4, hours=17)).isoformat(),
                },
            ],
            'auto_rebooked_option': {
                'option_id': 'rebook-miss-1',
                'flight_number': 'AA8800',
                'origin': 'LAX',
                'destination': 'HNL',
                'departure_time': (now + timedelta(days=4, hours=21)).isoformat(),
                'arrival_time': (now + timedelta(days=5, hours=0, minutes=30)).isoformat(),
                'gate': 'T6',
                'seat': '14B',
                'connection_risk': 'low',
                'is_auto_offered': True,
                'acceptance_deadline': (now + timedelta(days=4, hours=17)).isoformat(),
            },
            'connection_risks': [
                {
                    'connection_flight_number': 'AA1122',
                    'origin': 'LAX',
                    'destination': 'HNL',
                    'connection_time_minutes': 105,
                    'minimum_connection_time': 90,
                    'risk_level': 'medium',
                    'reason': 'First flight delay reduces connection buffer to potentially unsafe margin',
                },
            ],
            'acknowledged': False,
            'acknowledged_at': None,
            'created_at': (now - timedelta(minutes=30)).isoformat(),
        },
    }

    return irop_scenarios.get(confirmation_code)


def get_irop_status(confirmation_code: str) -> Dict[str, Any]:
    """
    Get full IROP status for a reservation.

    Returns:
        IROPStatus dict with disruption info
    """
    disruption = get_irop_demo_disruption(confirmation_code)

    if disruption:
        return {
            'has_disruption': True,
            'disruption': disruption,
            'affected_flights': [disruption['flight_number']],
            'connection_at_risk': len(disruption.get('connection_risks', [])) > 0,
            'auto_rebooking_available': disruption.get('auto_rebooked_option') is not None,
            'requires_action': not disruption.get('acknowledged', False),
        }

    return {
        'has_disruption': False,
        'disruption': None,
        'affected_flights': [],
        'connection_at_risk': False,
        'auto_rebooking_available': False,
        'requires_action': False,
    }
