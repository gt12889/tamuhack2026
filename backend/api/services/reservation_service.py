"""Database service for reservation and flight operations.

This module replaces mock data lookups with actual database queries.
"""

import logging
from typing import Optional, List, Dict, Any
from django.db.models import Q

from ..models import Passenger, Flight, Reservation, FlightSegment

logger = logging.getLogger(__name__)


class ReservationService:
    """Service for managing reservations in the database."""

    def lookup_reservation(
        self,
        confirmation_code: Optional[str] = None,
        last_name: Optional[str] = None,
        email: Optional[str] = None
    ) -> Optional[Reservation]:
        """
        Look up a reservation by confirmation code, last name, or email.

        Args:
            confirmation_code: 6-character confirmation code
            last_name: Passenger's last name
            email: Passenger's email

        Returns:
            Reservation object or None if not found
        """
        try:
            queryset = Reservation.objects.select_related('passenger').prefetch_related(
                'flight_segments__flight'
            )

            if confirmation_code:
                return queryset.get(confirmation_code=confirmation_code.upper())

            if last_name:
                return queryset.filter(
                    passenger__last_name__iexact=last_name
                ).first()

            if email:
                return queryset.filter(
                    passenger__email__iexact=email
                ).first()

            return None

        except Reservation.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error looking up reservation: {e}")
            return None

    def get_reservation_by_id(self, reservation_id: str) -> Optional[Reservation]:
        """
        Get a reservation by its UUID.

        Args:
            reservation_id: UUID of the reservation

        Returns:
            Reservation object or None if not found
        """
        try:
            return Reservation.objects.select_related('passenger').prefetch_related(
                'flight_segments__flight'
            ).get(id=reservation_id)
        except Reservation.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting reservation by ID: {e}")
            return None

    def search_reservations(
        self,
        query: str,
        limit: int = 10
    ) -> List[Reservation]:
        """
        Search reservations by confirmation code, passenger name, or email.

        Args:
            query: Search query string
            limit: Maximum number of results

        Returns:
            List of matching Reservation objects
        """
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

        Args:
            confirmation_code: 6-character confirmation code
            passenger_data: Dict with passenger info (first_name, last_name, email, etc.)
            flight_segments: List of dicts with flight and seat info

        Returns:
            Created Reservation object or None if failed
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

            logger.info(f"Created reservation {confirmation_code} for {passenger.email}")
            return reservation

        except Exception as e:
            logger.error(f"Error creating reservation: {e}")
            return None

    def update_reservation_status(
        self,
        reservation_id: str,
        new_status: str
    ) -> Optional[Reservation]:
        """
        Update reservation status.

        Args:
            reservation_id: UUID of the reservation
            new_status: New status ('confirmed', 'changed', 'cancelled')

        Returns:
            Updated Reservation object or None if failed
        """
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

        Args:
            reservation_id: UUID of the reservation
            segment_order: Which segment to change (0-based)
            new_flight_data: New flight information
            new_seat: New seat assignment (optional)

        Returns:
            Updated Reservation object or None if failed
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
            return reservation

        except Reservation.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error changing flight: {e}")
            return None

    def get_passenger_reservations(
        self,
        passenger_email: str
    ) -> List[Reservation]:
        """
        Get all reservations for a passenger by email.

        Args:
            passenger_email: Passenger's email address

        Returns:
            List of Reservation objects
        """
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
