"""Serializers for AA Voice Concierge API."""

from rest_framework import serializers
from .models import Passenger, Flight, Reservation, FlightSegment, Session, Message


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
    flight_number = serializers.CharField(source='flight.flight_number', read_only=True)
    origin = serializers.CharField(source='flight.origin', read_only=True)
    destination = serializers.CharField(source='flight.destination', read_only=True)
    departure_time = serializers.DateTimeField(source='flight.departure_time', read_only=True)
    arrival_time = serializers.DateTimeField(source='flight.arrival_time', read_only=True)
    gate = serializers.CharField(source='flight.gate', read_only=True)
    status = serializers.CharField(source='flight.status', read_only=True)

    class Meta:
        model = FlightSegment
        fields = [
            'id', 'flight_number', 'origin', 'destination',
            'departure_time', 'arrival_time', 'gate', 'status', 'seat'
        ]


class ReservationSerializer(serializers.ModelSerializer):
    passenger = PassengerSerializer(read_only=True)
    flights = FlightSegmentSerializer(source='flight_segments', many=True, read_only=True)

    class Meta:
        model = Reservation
        fields = ['id', 'confirmation_code', 'passenger', 'flights', 'status', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'audio_url', 'intent', 'entities', 'timestamp']


class SessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    reservation = ReservationSerializer(read_only=True)

    class Meta:
        model = Session
        fields = ['id', 'state', 'reservation', 'messages', 'helper_link', 'created_at', 'expires_at']


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
