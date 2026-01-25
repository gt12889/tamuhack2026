"""
Location tracking service for elderly passengers.
Tracks GPS locations, calculates distances, estimates walking times,
and determines alert status based on time-to-departure.
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from math import radians, sin, cos, sqrt, atan2
from typing import Optional, Dict, Any, Tuple

from django.utils import timezone

from ..models import Session, PassengerLocation, LocationAlert
from .airport_data import (
    get_gate_location,
    get_airport_geofence,
    find_nearest_airport,
    get_simple_directions,
    WALKING_SPEEDS,
)

logger = logging.getLogger(__name__)


class AlertStatus(Enum):
    """Alert status based on distance and time analysis."""
    SAFE = 'safe'           # Plenty of time
    WARNING = 'warning'     # Cutting it close
    URGENT = 'urgent'       # May miss flight
    ARRIVED = 'arrived'     # At or near gate


class LocationService:
    """
    Service for managing passenger location tracking.
    """

    # Minimum distance (meters) to consider significant movement
    MIN_MOVEMENT_THRESHOLD = 50

    # Distance thresholds for alert status (meters)
    GATE_ARRIVAL_THRESHOLD = 100  # Within 100m is "arrived"

    # Time buffers (minutes)
    SAFE_BUFFER = 30      # At least 30 min buffer = safe
    WARNING_BUFFER = 15   # 15-30 min buffer = warning
    # Less than 15 min buffer = urgent

    def update_location(
        self,
        session_id: str,
        lat: float,
        lng: float,
        accuracy: Optional[float] = None
    ) -> Optional[PassengerLocation]:
        """
        Update passenger location for a session.

        Only stores if movement is significant (> MIN_MOVEMENT_THRESHOLD meters)
        or if this is the first location.

        Args:
            session_id: Session UUID
            lat: Latitude
            lng: Longitude
            accuracy: GPS accuracy in meters (optional)

        Returns:
            PassengerLocation object or None if not stored
        """
        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            logger.warning(f"Session {session_id} not found for location update")
            return None

        # Check last location
        last_location = session.locations.first()

        # Store if first location or significant movement
        should_store = True
        if last_location:
            distance = self._calculate_distance(
                float(last_location.latitude),
                float(last_location.longitude),
                lat, lng
            )
            if distance < self.MIN_MOVEMENT_THRESHOLD:
                should_store = False

        if should_store:
            location = PassengerLocation.objects.create(
                session=session,
                latitude=Decimal(str(lat)),
                longitude=Decimal(str(lng)),
                accuracy=accuracy,
            )
            logger.info(f"Location stored for session {session_id}: {lat}, {lng}")
            return location

        return None

    def get_current_location(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the most recent location for a session.

        Args:
            session_id: Session UUID

        Returns:
            Dict with lat, lng, accuracy, timestamp or None
        """
        try:
            session = Session.objects.get(id=session_id)
            location = session.locations.first()

            if location:
                return {
                    'lat': float(location.latitude),
                    'lng': float(location.longitude),
                    'accuracy': location.accuracy,
                    'timestamp': location.timestamp.isoformat(),
                }
        except Session.DoesNotExist:
            pass

        return None

    def get_gate_location_for_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get gate location for the session's flight.

        Args:
            session_id: Session UUID

        Returns:
            Dict with lat, lng, gate, terminal or None
        """
        try:
            session = Session.objects.select_related(
                'reservation'
            ).prefetch_related(
                'reservation__flight_segments__flight'
            ).get(id=session_id)

            if not session.reservation:
                return None

            segment = session.reservation.flight_segments.first()
            if not segment or not segment.flight:
                return None

            flight = segment.flight
            if not flight.gate:
                return None

            gate_loc = get_gate_location(flight.origin, flight.gate)
            if gate_loc:
                return {
                    'lat': gate_loc['lat'],
                    'lng': gate_loc['lng'],
                    'gate': flight.gate,
                    'terminal': gate_loc.get('terminal', ''),
                    'approximate': gate_loc.get('approximate', False),
                }
        except Session.DoesNotExist:
            pass

        return None

    def calculate_distance_to_gate(
        self,
        user_lat: float,
        user_lng: float,
        gate_lat: float,
        gate_lng: float
    ) -> float:
        """
        Calculate distance between user and gate in meters.

        Args:
            user_lat: User latitude
            user_lng: User longitude
            gate_lat: Gate latitude
            gate_lng: Gate longitude

        Returns:
            Distance in meters
        """
        return self._calculate_distance(user_lat, user_lng, gate_lat, gate_lng)

    def estimate_walking_time(
        self,
        distance_meters: float,
        pace: str = 'elderly'
    ) -> int:
        """
        Estimate walking time for a given distance.

        Args:
            distance_meters: Distance in meters
            pace: 'normal', 'elderly', or 'rushed'

        Returns:
            Estimated time in minutes
        """
        speed = WALKING_SPEEDS.get(pace, WALKING_SPEEDS['elderly'])
        minutes = distance_meters / speed
        return max(1, round(minutes))  # At least 1 minute

    def is_in_airport(
        self,
        lat: float,
        lng: float,
        airport_code: str
    ) -> bool:
        """
        Check if a location is within an airport's geofence.

        Args:
            lat: Latitude
            lng: Longitude
            airport_code: IATA airport code

        Returns:
            True if within airport geofence
        """
        geofence = get_airport_geofence(airport_code)
        if not geofence:
            return False

        distance_km = self._calculate_distance(
            lat, lng,
            geofence['lat'], geofence['lng']
        ) / 1000  # Convert to km

        return distance_km <= geofence['radius_km']

    def check_alert_status(self, session_id: str) -> Dict[str, Any]:
        """
        Check the alert status for a session based on location and time.

        Args:
            session_id: Session UUID

        Returns:
            Dict with alert_status, distance, walking_time, time_to_departure, message
        """
        result = {
            'alert_status': AlertStatus.SAFE.value,
            'distance_meters': None,
            'walking_time_minutes': None,
            'time_to_departure_minutes': None,
            'message': '',
            'directions': '',
        }

        try:
            session = Session.objects.select_related(
                'reservation'
            ).prefetch_related(
                'reservation__flight_segments__flight'
            ).get(id=session_id)
        except Session.DoesNotExist:
            result['message'] = 'Session not found'
            return result

        # Get current location
        user_location = self.get_current_location(session_id)
        if not user_location:
            result['message'] = 'No location data available'
            return result

        # Get gate location
        gate_location = self.get_gate_location_for_session(session_id)
        if not gate_location:
            result['message'] = 'Gate information not available'
            return result

        # Get flight departure time
        segment = session.reservation.flight_segments.first()
        if not segment or not segment.flight:
            result['message'] = 'Flight information not available'
            return result

        departure_time = segment.flight.departure_time
        now = timezone.now()

        # Calculate metrics
        distance = self.calculate_distance_to_gate(
            user_location['lat'], user_location['lng'],
            gate_location['lat'], gate_location['lng']
        )
        walking_time = self.estimate_walking_time(distance)
        time_to_departure = max(0, int((departure_time - now).total_seconds() / 60))

        result['distance_meters'] = round(distance)
        result['walking_time_minutes'] = walking_time
        result['time_to_departure_minutes'] = time_to_departure

        # Determine alert status
        if distance <= self.GATE_ARRIVAL_THRESHOLD:
            result['alert_status'] = AlertStatus.ARRIVED.value
            result['message'] = f"You've arrived at gate {gate_location['gate']}!"
        elif walking_time > time_to_departure - self.WARNING_BUFFER:
            result['alert_status'] = AlertStatus.URGENT.value
            result['message'] = f"Urgent: You may miss your flight! Gate closes in {time_to_departure - 15} minutes."
        elif walking_time > time_to_departure - self.SAFE_BUFFER:
            result['alert_status'] = AlertStatus.WARNING.value
            result['message'] = f"Please head to your gate now. It's about {walking_time} minutes away."
        else:
            result['alert_status'] = AlertStatus.SAFE.value
            result['message'] = f"You have plenty of time. Gate {gate_location['gate']} is about {walking_time} minutes away."

        # Get directions
        result['directions'] = get_simple_directions(
            user_location['lat'],
            user_location['lng'],
            gate_location['gate'],
            segment.flight.origin,
            session.reservation.passenger.language_preference or 'en'
        )

        return result

    def get_location_metrics(self, session_id: str) -> Dict[str, Any]:
        """
        Get comprehensive location metrics for helper dashboard.

        Args:
            session_id: Session UUID

        Returns:
            Dict with passenger_location, gate_location, metrics, directions
        """
        result = {
            'passenger_location': None,
            'gate_location': None,
            'metrics': None,
            'directions': '',
            'alert': None,
        }

        user_location = self.get_current_location(session_id)
        if user_location:
            result['passenger_location'] = user_location

        gate_location = self.get_gate_location_for_session(session_id)
        if gate_location:
            result['gate_location'] = gate_location

        alert_status = self.check_alert_status(session_id)
        result['metrics'] = {
            'distance_meters': alert_status.get('distance_meters'),
            'walking_time_minutes': alert_status.get('walking_time_minutes'),
            'time_to_departure_minutes': alert_status.get('time_to_departure_minutes'),
            'alert_status': alert_status.get('alert_status'),
        }
        result['directions'] = alert_status.get('directions', '')
        result['message'] = alert_status.get('message', '')

        # Check for recent alerts
        try:
            session = Session.objects.get(id=session_id)
            recent_alert = session.location_alerts.filter(
                acknowledged=False
            ).first()
            if recent_alert:
                result['alert'] = {
                    'id': str(recent_alert.id),
                    'type': recent_alert.alert_type,
                    'message': recent_alert.message,
                    'created_at': recent_alert.created_at.isoformat(),
                }
        except Session.DoesNotExist:
            pass

        return result

    def _calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate distance between two points using Haversine formula.

        Returns:
            Distance in meters
        """
        R = 6371000  # Earth's radius in meters

        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))

        return R * c


# Singleton instance
location_service = LocationService()
