"""Database service for reservation and flight operations.

This module replaces mock data lookups with actual database queries.
"""

import logging
from typing import Optional, List, Dict, Any
from django.db.models import Q

# --- ADDED: Import the email service ---
from .resend_service import resend_service
from ..models import Passenger, Flight, Reservation, FlightSegment

logger = logging.getLogger(__name__)


class ReservationService:
    """Service for managing reservations in the database."""

    # ... (lookup_reservation, get_reservation_by_id, search_reservations methods remain unchanged) ...

    def lookup_reservation(
        self,
        confirmation_code: Optional[str] = None,
        last_name: Optional[str] = None,
        email: Optional[str] = None
    ) -> Optional[Reservation]:
        # ... (implementation unchanged) ...
        try:
            queryset = Reservation.objects.select_related('passenger').prefetch_related(
                'flight_segments__flight'
            )
            if confirmation_code:
                return queryset.get(confirmation_code=confirmation_code.upper())
            if last_name:
                return queryset.filter(passenger__last_name__iexact=last_name).first()
            if email:
                return queryset.filter(passenger__email__iexact=email).first()
            return None
        except Reservation.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error looking up reservation: {e}")
            return None

    def get_reservation_by_id(self, reservation_id: str) -> Optional[Reservation]:
        # ... (implementation unchanged) ...
        try:
            return Reservation.objects.select_related('passenger').prefetch_related(
                'flight_segments__flight'
            ).get(id=reservation_id)
        except Reservation.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting reservation by ID: {e}")
            return None

    def search_reservations(self, query: str, limit: int = 10) -> List[Reservation]:
        # ... (implementation unchanged) ...
        try:
            queryset = Reservation.objects.select_related('passenger').prefetch_related(
                'flight_segments__flight'
            ).filter(
                Q(confirmation_code__icontains=query.upper()) |
                Q(passenger__first_name__icontains=query) |
                Q(passenger__last_name__icontains=query) |
                Q(passenger__email__icontains=query)
            )[:limit]
            return list(queryset)
        except Exception as e:
            logger.error(f"Error searching reservations: {e}")
            return []

    def create_reservation(
        self,
        confirmation_code: str,
        passenger_data: Dict[str, Any],
        flight_segments: List[Dict[str, Any]]
    ) -> Optional[Reservation]:
        """
        Create a new reservation with passenger and flight segments.
        """
        from dateutil.parser import parse as parse_datetime

        try:
            # Create or get passenger
            passenger, created = Passenger.objects.get_or_create(
                email=passenger_data.get('email'),
                defaults={
                    'first_name': passenger_data.get('first_name', ''),
                    'last_name': passenger_data.get('last_name', ''),
                    'phone': passenger_data.get('phone'),
                    'aadvantage_number': passenger_data.get('aadvantage_number'),
                    'language_preference': passenger_data.get('language_preference', 'en'),
                    'seat_preference': passenger_data.get('seat_preference'),
                }
            )

            # Create reservation
            reservation = Reservation.objects.create(
                confirmation_code=confirmation_code.upper(),
                passenger=passenger,
                status='confirmed',
            )

            email_flight_details = []

            # Create flight segments
            for i, segment_data in enumerate(flight_segments):
                flight_data = segment_data.get('flight', segment_data)

                # Parse datetime strings if needed
                departure_time = flight_data.get('departure_time')
                arrival_time = flight_data.get('arrival_time')

                if isinstance(departure_time, str):
                    departure_time = parse_datetime(departure_time)
                if isinstance(arrival_time, str):
                    arrival_time = parse_datetime(arrival_time)

                # Create or get flight
                flight, _ = Flight.objects.get_or_create(
                    flight_number=flight_data.get('flight_number'),
                    departure_time=departure_time,
                    defaults={
                        'origin': flight_data.get('origin', ''),
                        'destination': flight_data.get('destination', ''),
                        'arrival_time': arrival_time,
                        'gate': flight_data.get('gate'),
                        'status': flight_data.get('status', 'scheduled'),
                    }
                )

                # Create flight segment
                FlightSegment.objects.create(
                    reservation=reservation,
                    flight=flight,
                    seat=segment_data.get('seat'),
                    segment_order=i,
                )

                # Collect data for email
                email_flight_details.append({
                    'flight_number': flight.flight_number,
                    'origin': flight.origin,
                    'destination': flight.destination,
                    'departure_time': flight.departure_time.isoformat(),
                    'arrival_time': flight.arrival_time.isoformat() if flight.arrival_time else '',
                    'gate': flight.gate or 'TBD',
                    'seat': segment_data.get('seat', 'Not assigned'),
                })

            logger.info(f"Created reservation {confirmation_code} for {passenger.email}")

            # --- ADDED: Send Booking Confirmation Email ---
            try:
                resend_service.send_booking_confirmation(
                    to_email=passenger.email,
                    passenger_name=f"{passenger.first_name} {passenger.last_name}",
                    confirmation_code=reservation.confirmation_code,
                    flight_details=email_flight_details,
                    language=passenger.language_preference or 'en'
                )
            except Exception as e:
                logger.error(f"Failed to send booking email: {e}")

            return reservation

        except Exception as e:
            logger.error(f"Error creating reservation: {e}")
            return None

    def update_reservation_status(self, reservation_id: str, new_status: str) -> Optional[Reservation]:
        # ... (implementation unchanged) ...
        try:
            reservation = Reservation.objects.get(id=reservation_id)
            reservation.status = new_status
            reservation.save()
            return reservation
        except Reservation.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error updating reservation status: {e}")
            return None

    def change_flight(
        self,
        reservation_id: str,
        segment_order: int,
        new_flight_data: Dict[str, Any],
        new_seat: Optional[str] = None
    ) -> Optional[Reservation]:
        """
        Change a flight segment to a new flight.
        """
        from dateutil.parser import parse as parse_datetime

        try:
            reservation = Reservation.objects.select_related('passenger').prefetch_related(
                'flight_segments__flight'
            ).get(id=reservation_id)

            # Find the segment to change
            segment = reservation.flight_segments.filter(segment_order=segment_order).first()
            if not segment:
                logger.error(f"Segment {segment_order} not found for reservation {reservation_id}")
                return None

            # --- ADDED: Capture Original Flight Data ---
            original_flight_data = {
                'flight_number': segment.flight.flight_number,
                'origin': segment.flight.origin,
                'destination': segment.flight.destination,
                'departure_time': segment.flight.departure_time.isoformat(),
                'seat': segment.seat
            }

            # Parse datetime strings if needed
            departure_time = new_flight_data.get('departure_time')
            arrival_time = new_flight_data.get('arrival_time')

            if isinstance(departure_time, str):
                departure_time = parse_datetime(departure_time)
            if isinstance(arrival_time, str):
                arrival_time = parse_datetime(arrival_time)

            # Create or get the new flight
            new_flight, _ = Flight.objects.get_or_create(
                flight_number=new_flight_data.get('flight_number'),
                departure_time=departure_time,
                defaults={
                    'origin': new_flight_data.get('origin', ''),
                    'destination': new_flight_data.get('destination', ''),
                    'arrival_time': arrival_time,
                    'gate': new_flight_data.get('gate'),
                    'status': new_flight_data.get('status', 'scheduled'),
                }
            )

            # Update the segment
            segment.flight = new_flight
            if new_seat:
                segment.seat = new_seat
            segment.save()

            # Update reservation status
            reservation.status = 'changed'
            reservation.save()

            logger.info(f"Changed flight for reservation {reservation.confirmation_code}")

            # --- ADDED: Send Flight Change Confirmation Email ---
            if reservation.passenger.email:
                try:
                    resend_service.send_flight_change_confirmation(
                        to_email=reservation.passenger.email,
                        passenger_name=f"{reservation.passenger.first_name} {reservation.passenger.last_name}",
                        confirmation_code=reservation.confirmation_code,
                        original_flight=original_flight_data,
                        new_flight=new_flight_data,
                        language=reservation.passenger.language_preference or 'en'
                    )
                except Exception as e:
                    logger.error(f"Failed to send flight change email: {e}")

            return reservation

        except Reservation.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error changing flight: {e}")
            return None

    def get_passenger_reservations(self, passenger_email: str) -> List[Reservation]:
        # ... (implementation unchanged) ...
        try:
            return list(
                Reservation.objects.select_related('passenger').prefetch_related(
                    'flight_segments__flight'
                ).filter(
                    passenger__email__iexact=passenger_email
                ).order_by('-created_at')
            )
        except Exception as e:
            logger.error(f"Error getting passenger reservations: {e}")
            return []


# Singleton instance
reservation_service = ReservationService()