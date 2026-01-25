"""Serializers for Elder Strolls API."""

from rest_framework import serializers
from .models import Passenger, Flight, Reservation, FlightSegment, Session, Message, FamilyAction, PassengerLocation, LocationAlert


class PassengerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Passenger
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'aadvantage_number', 'language_preference', 'seat_preference'
        ]


class FlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flight
        fields = [
            'id', 'flight_number', 'origin', 'destination',
            'departure_time', 'arrival_time', 'gate', 'status'
        ]


class FlightSegmentSerializer(serializers.ModelSerializer):
    """Serializer for FlightSegment with nested flight details (read) and IDs (write)."""
    # Read-only nested flight details
    flight_number = serializers.CharField(source='flight.flight_number', read_only=True)
    origin = serializers.CharField(source='flight.origin', read_only=True)
    destination = serializers.CharField(source='flight.destination', read_only=True)
    departure_time = serializers.DateTimeField(source='flight.departure_time', read_only=True)
    arrival_time = serializers.DateTimeField(source='flight.arrival_time', read_only=True)
    gate = serializers.CharField(source='flight.gate', read_only=True)
    flight_status = serializers.CharField(source='flight.status', read_only=True)
    
    # Write fields for creating/updating
    reservation_id = serializers.UUIDField(write_only=True, required=False)
    flight_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = FlightSegment
        fields = [
            'id', 'reservation', 'flight', 'seat', 'segment_order',
            # Nested read-only fields
            'flight_number', 'origin', 'destination',
            'departure_time', 'arrival_time', 'gate', 'flight_status',
            # Write-only fields
            'reservation_id', 'flight_id',
        ]
        extra_kwargs = {
            'reservation': {'read_only': True},
            'flight': {'read_only': True},
        }
    
    def create(self, validated_data):
        reservation_id = validated_data.pop('reservation_id', None)
        flight_id = validated_data.pop('flight_id', None)
        
        if reservation_id:
            validated_data['reservation_id'] = reservation_id
        if flight_id:
            validated_data['flight_id'] = flight_id
            
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        reservation_id = validated_data.pop('reservation_id', None)
        flight_id = validated_data.pop('flight_id', None)
        
        if reservation_id:
            instance.reservation_id = reservation_id
        if flight_id:
            instance.flight_id = flight_id
            
        return super().update(instance, validated_data)


class ReservationSerializer(serializers.ModelSerializer):
    """Serializer for Reservation with nested passenger and flights."""
    passenger = PassengerSerializer(read_only=True)
    flights = FlightSegmentSerializer(source='flight_segments', many=True, read_only=True)
    
    # Write field for linking to passenger
    passenger_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Reservation
        fields = [
            'id', 'confirmation_code', 'passenger', 'passenger_id',
            'flights', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        passenger_id = validated_data.pop('passenger_id', None)
        if passenger_id:
            validated_data['passenger_id'] = passenger_id
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        passenger_id = validated_data.pop('passenger_id', None)
        if passenger_id:
            instance.passenger_id = passenger_id
        return super().update(instance, validated_data)


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message with session linkage."""
    session_id = serializers.UUIDField(write_only=True, required=False)
    
    class Meta:
        model = Message
        fields = [
            'id', 'session', 'session_id', 'role', 'content',
            'audio_url', 'intent', 'entities', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
        extra_kwargs = {
            'session': {'read_only': True},
        }
    
    def create(self, validated_data):
        session_id = validated_data.pop('session_id', None)
        if session_id:
            validated_data['session_id'] = session_id
        return super().create(validated_data)


class SessionSerializer(serializers.ModelSerializer):
    """Serializer for Session with nested messages and reservation."""
    messages = MessageSerializer(many=True, read_only=True)
    reservation = ReservationSerializer(read_only=True)
    
    # Write field for linking to reservation
    reservation_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Session
        fields = [
            'id', 'state', 'reservation', 'reservation_id', 'messages',
            'helper_link', 'context', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        reservation_id = validated_data.pop('reservation_id', None)
        if reservation_id:
            validated_data['reservation_id'] = reservation_id
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        reservation_id = validated_data.pop('reservation_id', None)
        if reservation_id is not None:
            instance.reservation_id = reservation_id
        return super().update(instance, validated_data)


# Request/Response serializers

class StartConversationRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(required=False)


class StartConversationResponseSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    greeting = serializers.CharField()
    audio_url = serializers.CharField(allow_null=True)


class MessageRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    transcript = serializers.CharField()


class SuggestedActionSerializer(serializers.Serializer):
    type = serializers.CharField()
    label = serializers.CharField()
    value = serializers.CharField(required=False)


class ConversationResponseSerializer(serializers.Serializer):
    reply = serializers.CharField()
    audio_url = serializers.CharField(allow_null=True)
    intent = serializers.CharField()
    entities = serializers.DictField()
    suggested_actions = SuggestedActionSerializer(many=True)
    session_state = serializers.CharField()
    reservation = ReservationSerializer(required=False)
    flight_options = FlightSerializer(many=True, required=False)


class ReservationLookupSerializer(serializers.Serializer):
    confirmation_code = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)


class ChangeReservationSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    reservation_id = serializers.UUIDField()
    new_flight_id = serializers.CharField()


class VoiceSynthesizeSerializer(serializers.Serializer):
    text = serializers.CharField()
    language = serializers.ChoiceField(choices=['en', 'es'], default='en')


class HelperCreateLinkSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()


class HelperSuggestionSerializer(serializers.Serializer):
    message = serializers.CharField()


class FamilyActionSerializer(serializers.ModelSerializer):
    """Serializer for FamilyAction."""
    session_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = FamilyAction
        fields = [
            'id', 'session', 'session_id', 'action_type', 'action_data',
            'status', 'family_notes', 'result_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'session': {'read_only': True},
        }

    def create(self, validated_data):
        session_id = validated_data.pop('session_id', None)
        if session_id:
            validated_data['session_id'] = session_id
        return super().create(validated_data)


# Family action request serializers

class ChangeFlightActionSerializer(serializers.Serializer):
    new_flight_id = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)


class CancelFlightActionSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class SelectSeatActionSerializer(serializers.Serializer):
    seat = serializers.CharField()
    flight_segment_id = serializers.UUIDField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class AddBagsActionSerializer(serializers.Serializer):
    bag_count = serializers.IntegerField(min_value=1, max_value=10)
    notes = serializers.CharField(required=False, allow_blank=True)


class RequestWheelchairActionSerializer(serializers.Serializer):
    assistance_type = serializers.ChoiceField(
        choices=['wheelchair', 'wheelchair_ramp', 'escort'],
        default='wheelchair'
    )
    notes = serializers.CharField(required=False, allow_blank=True)


# Location tracking serializers

class PassengerLocationSerializer(serializers.ModelSerializer):
    """Serializer for PassengerLocation."""
    session_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = PassengerLocation
        fields = [
            'id', 'session', 'session_id', 'latitude', 'longitude',
            'accuracy', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
        extra_kwargs = {
            'session': {'read_only': True},
        }

    def create(self, validated_data):
        session_id = validated_data.pop('session_id', None)
        if session_id:
            validated_data['session_id'] = session_id
        return super().create(validated_data)


class LocationAlertSerializer(serializers.ModelSerializer):
    """Serializer for LocationAlert."""
    session_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = LocationAlert
        fields = [
            'id', 'session', 'session_id', 'alert_type', 'message',
            'distance_to_gate', 'estimated_walking_time', 'time_to_departure',
            'acknowledged', 'voice_call_sent', 'email_sent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'session': {'read_only': True},
        }


class LocationUpdateRequestSerializer(serializers.Serializer):
    """Request serializer for location update endpoint."""
    session_id = serializers.UUIDField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    accuracy = serializers.FloatField(required=False, allow_null=True)


class TriggerLocationAlertSerializer(serializers.Serializer):
    """Request serializer for triggering location alerts."""
    session_id = serializers.UUIDField()
    alert_type = serializers.ChoiceField(
        choices=['running_late', 'urgent'],
        default='running_late'
    )
