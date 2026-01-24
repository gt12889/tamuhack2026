"""American Airlines Flight-Engine API integration.

Flight-Engine provides mock flight data for AA hackathons.
API Docs: https://github.com/AmericanAirlines/Flight-Engine
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import httpx
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Default Flight-Engine URL (can be overridden in settings)
FLIGHT_ENGINE_URL = getattr(settings, 'FLIGHT_ENGINE_URL', 'https://flight-engine-api.onrender.com')


class FlightEngineService:
    """Service for interacting with AA Flight-Engine API."""

    def __init__(self, base_url: str = None):
        self.base_url = base_url or FLIGHT_ENGINE_URL
        self.timeout = 10.0  # seconds

    def _make_request(self, endpoint: str, params: dict = None) -> Optional[dict]:
        """Make a GET request to Flight-Engine API."""
        url = f"{self.base_url}{endpoint}"
        cache_key = f"flight_engine:{endpoint}:{str(params)}"

        # Check cache first (5 min cache)
        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                # Cache successful responses
                cache.set(cache_key, data, timeout=300)
                return data

        except httpx.TimeoutException:
            logger.error(f"Flight-Engine API timeout: {url}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"Flight-Engine API error: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Flight-Engine API error: {e}")
            return None

    # ==================== Airport Endpoints ====================

    def get_airport(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Get airport information by IATA code.

        Args:
            code: 3-letter IATA airport code (e.g., 'DFW')

        Returns:
            Airport dict with code, city, timezone, location, etc.
        """
        data = self._make_request('/airports', params={'code': code.upper()})
        return data

    def get_all_airports(self) -> List[Dict[str, Any]]:
        """
        Get all supported airports.

        Returns:
            List of airport dicts
        """
        data = self._make_request('/airports/all')
        return data if data else []

    # ==================== Flight Endpoints ====================

    def get_flights(
        self,
        date: str,
        origin: str = None,
        destination: str = None,
        flight_number: str = None
    ) -> List[Dict[str, Any]]:
        """
        Get flights for a specific date with optional filters.

        Args:
            date: Date in YYYY-MM-DD format
            origin: Filter by origin airport code (optional)
            destination: Filter by destination airport code (optional)
            flight_number: Filter by flight number (optional)

        Returns:
            List of flight dicts
        """
        params = {'date': date}

        if origin:
            params['origin'] = origin.upper()
        if destination:
            params['destination'] = destination.upper()
        if flight_number:
            params['flightNumber'] = flight_number

        data = self._make_request('/flights', params=params)
        return data if data else []

    def get_flights_for_route(
        self,
        origin: str,
        destination: str,
        date: str = None
    ) -> List[Dict[str, Any]]:
        """
        Get all flights between two airports on a date.

        Args:
            origin: Origin airport code
            destination: Destination airport code
            date: Date in YYYY-MM-DD format (defaults to tomorrow)

        Returns:
            List of flight dicts
        """
        if not date:
            date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        return self.get_flights(
            date=date,
            origin=origin,
            destination=destination
        )

    def get_flight_by_number(
        self,
        flight_number: str,
        date: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific flight by flight number.

        Args:
            flight_number: Flight number (e.g., '1234' or 'AA1234')
            date: Date in YYYY-MM-DD format (defaults to tomorrow)

        Returns:
            Flight dict or None if not found
        """
        if not date:
            date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        # Strip 'AA' prefix if present
        if flight_number.upper().startswith('AA'):
            flight_number = flight_number[2:]

        flights = self.get_flights(date=date, flight_number=flight_number)
        return flights[0] if flights else None

    # ==================== Helper Methods ====================

    def format_flight_for_frontend(self, flight: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format Flight-Engine response for our frontend.

        Args:
            flight: Raw flight dict from Flight-Engine

        Returns:
            Formatted flight dict matching our frontend types
        """
        return {
            'id': f"fe-{flight.get('flightNumber', 'unknown')}",
            'flight_number': f"AA{flight.get('flightNumber', '')}",
            'origin': flight.get('origin', {}).get('code', ''),
            'destination': flight.get('destination', {}).get('code', ''),
            'departure_time': flight.get('departureTime', ''),
            'arrival_time': flight.get('arrivalTime', ''),
            'gate': flight.get('gate', 'TBD'),
            'status': 'scheduled',
            'duration': flight.get('duration', {}).get('locale', ''),
            'aircraft': flight.get('aircraft', {}).get('model', ''),
            'distance_miles': flight.get('distance', 0),
            'origin_city': flight.get('origin', {}).get('city', ''),
            'destination_city': flight.get('destination', {}).get('city', ''),
        }

    def get_alternative_flights_formatted(
        self,
        origin: str,
        destination: str,
        date: str
    ) -> List[Dict[str, Any]]:
        """
        Get alternative flights formatted for frontend.

        Args:
            origin: Origin airport code
            destination: Destination airport code
            date: Date in YYYY-MM-DD format

        Returns:
            List of formatted flight options
        """
        flights = self.get_flights_for_route(origin, destination, date)

        # Format and limit to 3 options
        formatted = [self.format_flight_for_frontend(f) for f in flights[:3]]

        # If no flights found, try nearby dates
        if not formatted:
            # Try day before
            prev_date = (datetime.strptime(date, '%Y-%m-%d') - timedelta(days=1)).strftime('%Y-%m-%d')
            flights = self.get_flights_for_route(origin, destination, prev_date)
            formatted = [self.format_flight_for_frontend(f) for f in flights[:3]]

        return formatted


# Singleton instance
flight_engine = FlightEngineService()
