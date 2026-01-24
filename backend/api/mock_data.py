"""Mock data for AA Voice Concierge demo."""

from datetime import datetime, timedelta
from django.utils import timezone

def get_demo_reservations():
    """Return mock reservation data for the demo."""
    now = timezone.now()

    return [
        {
            'confirmation_code': 'DEMO123',
            'passenger': {
                'first_name': 'Margaret',
                'last_name': 'Johnson',
                'email': 'margaret.johnson@example.com',
                'phone': '214-555-0123',
                'language_preference': 'en',
            },
            'flights': [
                {
                    'flight_number': 'AA1234',
                    'origin': 'DFW',
                    'destination': 'ORD',
                    'departure_time': (now + timedelta(days=1, hours=14)).isoformat(),
                    'arrival_time': (now + timedelta(days=1, hours=17)).isoformat(),
                    'gate': 'A12',
                    'seat': '14A',
                    'status': 'scheduled',
                }
            ],
        },
        {
            'confirmation_code': 'TEST456',
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
            'confirmation_code': 'ABUELA1',
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
            'confirmation_code': 'SENIOR2',
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
            'confirmation_code': 'FAMILY3',
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


def get_alternative_flights(origin: str, destination: str, date: str):
    """Return mock alternative flight options."""
    from dateutil.parser import parse

    try:
        target_date = parse(date)
    except:
        target_date = timezone.now() + timedelta(days=1)

    # Generate 3 alternative flights
    return [
        {
            'id': f'alt-{origin}-{destination}-1',
            'flight_number': f'AA{1000 + hash(f"{origin}{destination}1") % 9000}',
            'origin': origin,
            'destination': destination,
            'departure_time': target_date.replace(hour=8, minute=0).isoformat(),
            'arrival_time': (target_date.replace(hour=8, minute=0) + timedelta(hours=3)).isoformat(),
            'gate': 'TBD',
            'status': 'scheduled',
        },
        {
            'id': f'alt-{origin}-{destination}-2',
            'flight_number': f'AA{1000 + hash(f"{origin}{destination}2") % 9000}',
            'origin': origin,
            'destination': destination,
            'departure_time': target_date.replace(hour=14, minute=0).isoformat(),
            'arrival_time': (target_date.replace(hour=14, minute=0) + timedelta(hours=3)).isoformat(),
            'gate': 'TBD',
            'status': 'scheduled',
        },
        {
            'id': f'alt-{origin}-{destination}-3',
            'flight_number': f'AA{1000 + hash(f"{origin}{destination}3") % 9000}',
            'origin': origin,
            'destination': destination,
            'departure_time': target_date.replace(hour=19, minute=0).isoformat(),
            'arrival_time': (target_date.replace(hour=19, minute=0) + timedelta(hours=3)).isoformat(),
            'gate': 'TBD',
            'status': 'scheduled',
        },
    ]


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
}

CITY_NAMES = {
    'DFW': 'Dallas',
    'ORD': 'Chicago',
    'LAX': 'Los Angeles',
    'JFK': 'New York',
    'MIA': 'Miami',
    'PHX': 'Phoenix',
    'HNL': 'Honolulu',
}
