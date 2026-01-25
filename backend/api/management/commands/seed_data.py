"""
Management command to seed the database with test reservation data.

Usage:
    python manage.py seed_data
    python manage.py seed_data --clear  # Clear existing data first
"""

from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import Passenger, Flight, Reservation, FlightSegment


class Command(BaseCommand):
    help = 'Seed the database with test reservation data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing reservations before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            FlightSegment.objects.all().delete()
            Reservation.objects.all().delete()
            Flight.objects.all().delete()
            Passenger.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared all existing data'))

        now = timezone.now()
        
        # Test reservations data
        # NOTE: confirmation_code max_length=6, seat max_length=5, gate max_length=10
        # language_preference choices: 'en', 'es'
        # seat_preference choices: 'window', 'aisle', 'middle'
        # flight status choices: 'scheduled', 'delayed', 'cancelled', 'boarding', 'departed'
        # reservation status choices: 'confirmed', 'changed', 'cancelled'
        reservations_data = [
            {
                'confirmation_code': 'DEMO12',  # 6 chars max
                'passenger': {
                    'first_name': 'Margaret',
                    'last_name': 'Johnson',
                    'email': 'margaret.johnson@example.com',
                    'phone': '214-555-0123',  # max 20 chars
                    'aadvantage_number': 'AA1234567',  # max 20 chars
                    'language_preference': 'en',  # choices: 'en', 'es'
                    'seat_preference': 'window',  # choices: 'window', 'aisle', 'middle'
                },
                'flights': [
                    {
                        'flight_number': 'AA1234',  # max 10 chars
                        'origin': 'DFW',  # max 3 chars (airport code)
                        'destination': 'ORD',  # max 3 chars
                        'departure_time': now + timedelta(days=1, hours=14),
                        'arrival_time': now + timedelta(days=1, hours=17),
                        'gate': 'A12',  # max 10 chars
                        'seat': '14A',  # max 5 chars
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
                    'aadvantage_number': 'AA9876543',
                    'language_preference': 'en',
                    'seat_preference': 'aisle',
                },
                'flights': [
                    {
                        'flight_number': 'AA567',
                        'origin': 'LAX',
                        'destination': 'JFK',
                        'departure_time': now + timedelta(days=2, hours=9),
                        'arrival_time': now + timedelta(days=2, hours=17, minutes=30),
                        'gate': 'B7',
                        'seat': '22C',
                        'status': 'scheduled',
                    },
                    {
                        'flight_number': 'AA890',
                        'origin': 'JFK',
                        'destination': 'MIA',
                        'departure_time': now + timedelta(days=2, hours=19),
                        'arrival_time': now + timedelta(days=2, hours=22, minutes=15),
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
                    'aadvantage_number': None,
                    'language_preference': 'es',
                    'seat_preference': 'window',
                },
                'flights': [
                    {
                        'flight_number': 'AA2345',
                        'origin': 'MIA',
                        'destination': 'DFW',
                        'departure_time': now + timedelta(days=3, hours=11),
                        'arrival_time': now + timedelta(days=3, hours=13, minutes=45),
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
                    'aadvantage_number': 'AA5551234',
                    'language_preference': 'en',
                    'seat_preference': 'aisle',
                },
                'flights': [
                    {
                        'flight_number': 'AA789',
                        'origin': 'ORD',
                        'destination': 'DFW',
                        'departure_time': now + timedelta(days=1, hours=8),
                        'arrival_time': now + timedelta(days=1, hours=10, minutes=30),
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
                    'aadvantage_number': None,
                    'language_preference': 'en',
                    'seat_preference': 'window',
                },
                'flights': [
                    {
                        'flight_number': 'AA456',
                        'origin': 'PHX',
                        'destination': 'LAX',
                        'departure_time': now + timedelta(days=4, hours=15),
                        'arrival_time': now + timedelta(days=4, hours=16, minutes=15),
                        'gate': 'E22',
                        'seat': '12B',
                        'status': 'scheduled',
                    },
                    {
                        'flight_number': 'AA1122',
                        'origin': 'LAX',
                        'destination': 'HNL',
                        'departure_time': now + timedelta(days=4, hours=18),
                        'arrival_time': now + timedelta(days=4, hours=21, minutes=30),
                        'gate': 'T4',
                        'seat': '12B',
                        'status': 'scheduled',
                    }
                ],
            },
            {
                'confirmation_code': 'DELY01',
                'passenger': {
                    'first_name': 'James',
                    'last_name': 'Brown',
                    'email': 'james.brown@example.com',
                    'phone': '404-555-0890',
                    'aadvantage_number': 'AA7778899',
                    'language_preference': 'en',
                    'seat_preference': 'aisle',
                },
                'flights': [
                    {
                        'flight_number': 'AA3456',
                        'origin': 'ATL',
                        'destination': 'DFW',
                        'departure_time': now + timedelta(hours=6),
                        'arrival_time': now + timedelta(hours=8, minutes=30),
                        'gate': 'B15',
                        'seat': '18D',
                        'status': 'delayed',
                    }
                ],
            },
        ]

        created_count = 0
        skipped_count = 0

        for res_data in reservations_data:
            # Check if reservation already exists
            if Reservation.objects.filter(confirmation_code=res_data['confirmation_code']).exists():
                self.stdout.write(f"  Skipping {res_data['confirmation_code']} (already exists)")
                skipped_count += 1
                continue

            # Create passenger
            passenger_data = res_data['passenger']
            passenger, _ = Passenger.objects.get_or_create(
                email=passenger_data['email'],
                defaults={
                    'first_name': passenger_data['first_name'],
                    'last_name': passenger_data['last_name'],
                    'phone': passenger_data.get('phone'),
                    'aadvantage_number': passenger_data.get('aadvantage_number'),
                    'language_preference': passenger_data.get('language_preference', 'en'),
                    'seat_preference': passenger_data.get('seat_preference'),
                }
            )

            # Create reservation
            reservation = Reservation.objects.create(
                confirmation_code=res_data['confirmation_code'],
                passenger=passenger,
                status='confirmed',
            )

            # Create flights and segments
            for i, flight_data in enumerate(res_data['flights']):
                flight = Flight.objects.create(
                    flight_number=flight_data['flight_number'],
                    origin=flight_data['origin'],
                    destination=flight_data['destination'],
                    departure_time=flight_data['departure_time'],
                    arrival_time=flight_data['arrival_time'],
                    gate=flight_data.get('gate'),
                    status=flight_data.get('status', 'scheduled'),
                )
                FlightSegment.objects.create(
                    reservation=reservation,
                    flight=flight,
                    seat=flight_data.get('seat'),
                    segment_order=i,
                )

            self.stdout.write(f"  Created reservation {res_data['confirmation_code']} for {passenger.email}")
            created_count += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Seeding complete! Created {created_count} reservations, skipped {skipped_count}'))
        self.stdout.write('')
        self.stdout.write('Test confirmation codes (6 chars max):')
        self.stdout.write('  DEMO12 - Margaret Johnson (English, AAdvantage member)')
        self.stdout.write('  TEST45 - Robert Smith (Multi-leg LAX->JFK->MIA)')
        self.stdout.write('  ABUEL1 - Maria Garcia (Spanish speaker)')
        self.stdout.write('  SENR02 - William Thompson (English, AAdvantage member)')
        self.stdout.write('  FAML03 - Dorothy Williams (Multi-leg PHX->LAX->HNL)')
        self.stdout.write('  DELY01 - James Brown (Delayed flight ATL->DFW)')
