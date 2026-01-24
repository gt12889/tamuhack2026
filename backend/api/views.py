"""API views for AA Voice Concierge."""

import uuid
import secrets
from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Session, Message, Reservation, Passenger, Flight, FlightSegment
from .serializers import (
    ReservationSerializer,
    SessionSerializer,
    MessageSerializer,
)
from .services import GeminiService, ElevenLabsService
from .mock_data import (
    get_demo_reservations,
    get_alternative_flights,
    get_flights_for_date,
    get_airport_info,
    get_all_airports,
    CITY_NAMES
)

# Initialize services
gemini_service = GeminiService()
elevenlabs_service = ElevenLabsService()

# Session expiry
SESSION_EXPIRY_MINUTES = 30


def get_or_create_mock_reservation(confirmation_code: str):
    """Get or create a reservation from mock data."""
    demo_data = get_demo_reservations()

    for res_data in demo_data:
        if res_data['confirmation_code'].upper() == confirmation_code.upper():
            # Check if already in DB
            try:
                return Reservation.objects.get(confirmation_code=confirmation_code.upper())
            except Reservation.DoesNotExist:
                pass

            # Create passenger
            passenger = Passenger.objects.create(
                first_name=res_data['passenger']['first_name'],
                last_name=res_data['passenger']['last_name'],
                email=res_data['passenger']['email'],
                phone=res_data['passenger'].get('phone'),
                language_preference=res_data['passenger'].get('language_preference', 'en'),
            )

            # Create reservation
            reservation = Reservation.objects.create(
                confirmation_code=confirmation_code.upper(),
                passenger=passenger,
                status='confirmed',
            )

            # Create flights and segments
            for i, flight_data in enumerate(res_data['flights']):
                from dateutil.parser import parse
                flight = Flight.objects.create(
                    flight_number=flight_data['flight_number'],
                    origin=flight_data['origin'],
                    destination=flight_data['destination'],
                    departure_time=parse(flight_data['departure_time']),
                    arrival_time=parse(flight_data['arrival_time']),
                    gate=flight_data.get('gate'),
                    status=flight_data.get('status', 'scheduled'),
                )
                FlightSegment.objects.create(
                    reservation=reservation,
                    flight=flight,
                    seat=flight_data.get('seat'),
                    segment_order=i,
                )

            return reservation

    return None


@api_view(['POST'])
def start_conversation(request):
    """Start a new conversation session."""
    session_id = request.data.get('session_id')

    if session_id:
        try:
            session = Session.objects.get(id=session_id)
            if session.expires_at > timezone.now():
                # Resume existing session
                messages = session.messages.all()
                last_assistant_msg = messages.filter(role='assistant').last()

                return Response({
                    'session_id': str(session.id),
                    'greeting': last_assistant_msg.content if last_assistant_msg else "Welcome back! How can I help you?",
                    'audio_url': last_assistant_msg.audio_url if last_assistant_msg else None,
                })
        except Session.DoesNotExist:
            pass

    # Create new session
    session = Session.objects.create(
        state='greeting',
        expires_at=timezone.now() + timedelta(minutes=SESSION_EXPIRY_MINUTES),
        context={},
    )

    greeting = "Hi! I'm your American Airlines assistant. I'm here to help with your trip. What do you need today?"

    # Generate audio for greeting
    audio_response = elevenlabs_service.synthesize(greeting)
    audio_url = audio_response.get('audio_url') if audio_response else None

    # Save greeting message
    Message.objects.create(
        session=session,
        role='assistant',
        content=greeting,
        audio_url=audio_url,
        intent='greeting',
    )

    return Response({
        'session_id': str(session.id),
        'greeting': greeting,
        'audio_url': audio_url,
    })


@api_view(['POST'])
def send_message(request):
    """Process a user message and return AI response."""

    session_id = request.data.get('session_id')
    transcript = request.data.get('transcript', '').strip()

    if not session_id or not transcript:
        return Response(
            {'error': 'session_id and transcript are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Save user message
    Message.objects.create(
        session=session,
        role='user',
        content=transcript,
    )

    # Get conversation history
    messages = list(session.messages.values('role', 'content')[:10])

    # Get reservation context if available
    reservation_context = None
    if session.reservation:
        reservation_context = ReservationSerializer(session.reservation).data

    # Process with Gemini
    ai_response = gemini_service.process_message(
        user_message=transcript,
        conversation_history=messages,
        reservation_context=reservation_context,
        session_state=session.state,
    )

    reply = ai_response['reply']
    intent = ai_response['intent']
    entities = ai_response['entities']
    action = ai_response.get('action', 'none')

    # Handle specific intents
    flight_options = []
    suggested_actions = []

    # Try to extract confirmation code if in lookup state
    if session.state in ['greeting', 'lookup'] and not session.reservation:
        code = gemini_service.extract_confirmation_code(transcript)
        if code:
            reservation = get_or_create_mock_reservation(code)
            if reservation:
                session.reservation = reservation
                session.state = 'viewing'
                session.save()

                # Update reply with reservation info
                flight = reservation.flight_segments.first()
                if flight:
                    dep_time = flight.flight.departure_time.strftime('%B %d at %I:%M %p')
                    origin = CITY_NAMES.get(flight.flight.origin, flight.flight.origin)
                    dest = CITY_NAMES.get(flight.flight.destination, flight.flight.destination)
                    reply = f"Got it! I found your reservation. You're flying from {origin} to {dest} on {dep_time}. What would you like to change?"
            else:
                reply = "I couldn't find a reservation with that code. Could you please check and try again?"
                session.state = 'lookup'
                session.save()

    # Handle flight change intent
    elif intent == 'change_flight' and session.reservation:
        session.state = 'changing'
        session.save()

        # Get alternative flights
        first_segment = session.reservation.flight_segments.first()
        if first_segment:
            from dateutil.parser import parse
            target_date = first_segment.flight.departure_time + timedelta(days=1)
            alternatives = get_alternative_flights(
                first_segment.flight.origin,
                first_segment.flight.destination,
                target_date.isoformat()
            )
            flight_options = alternatives

            if alternatives:
                opt1 = alternatives[0]
                from dateutil.parser import parse
                time1 = parse(opt1['departure_time']).strftime('%I:%M %p')
                reply = f"I found some flights for you. There's one at {time1}. Would you like me to book that for you?"

    # Handle confirmation
    elif intent == 'confirm_action' and session.state == 'changing':
        session.state = 'complete'
        session.save()
        reply = "Perfect! You're all set. Your new flight has been booked. I'm sending the details to your email. Is there anything else I can help with?"

    # Handle family help request
    elif intent == 'family_help':
        if not session.helper_link:
            session.helper_link = secrets.token_urlsafe(8)
            session.save()
        reply = f"I've created a link you can share with your family. They'll be able to see what we're working on and help guide you. The link is ready to share."
        suggested_actions.append({
            'type': 'share_link',
            'label': 'Share with Family',
            'value': session.helper_link,
        })

    # Generate audio response
    audio_response = elevenlabs_service.synthesize(reply)
    audio_url = audio_response.get('audio_url') if audio_response else None

    # Save assistant message
    Message.objects.create(
        session=session,
        role='assistant',
        content=reply,
        audio_url=audio_url,
        intent=intent,
        entities=entities,
    )

    # Build response
    response_data = {
        'reply': reply,
        'audio_url': audio_url,
        'intent': intent,
        'entities': entities,
        'suggested_actions': suggested_actions,
        'session_state': session.state,
    }

    if session.reservation:
        response_data['reservation'] = ReservationSerializer(session.reservation).data

    if flight_options:
        response_data['flight_options'] = flight_options

    return Response(response_data)


@api_view(['GET'])
def get_session(request, session_id):
    """Get session details."""
    try:
        session = Session.objects.get(id=session_id)
        return Response(SessionSerializer(session).data)
    except Session.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
def lookup_reservation(request):
    """Look up a reservation by confirmation code, name, or email."""
    code = request.query_params.get('confirmation_code', '').upper()
    last_name = request.query_params.get('last_name', '').lower()
    email = request.query_params.get('email', '').lower()

    if code:
        reservation = get_or_create_mock_reservation(code)
        if reservation:
            return Response({'reservation': ReservationSerializer(reservation).data})

    # Search by last name or email in mock data
    if last_name or email:
        for res_data in get_demo_reservations():
            if (last_name and res_data['passenger']['last_name'].lower() == last_name) or \
               (email and res_data['passenger']['email'].lower() == email):
                reservation = get_or_create_mock_reservation(res_data['confirmation_code'])
                if reservation:
                    return Response({'reservation': ReservationSerializer(reservation).data})

    return Response(
        {'error': 'Reservation not found'},
        status=status.HTTP_404_NOT_FOUND
    )


@api_view(['POST'])
def change_reservation(request):
    """Change a flight reservation."""
    session_id = request.data.get('session_id')
    reservation_id = request.data.get('reservation_id')
    new_flight_id = request.data.get('new_flight_id')

    try:
        session = Session.objects.get(id=session_id)
        reservation = Reservation.objects.get(id=reservation_id)
    except (Session.DoesNotExist, Reservation.DoesNotExist):
        return Response(
            {'error': 'Session or reservation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # For demo, just update the status
    reservation.status = 'changed'
    reservation.save()

    session.state = 'complete'
    session.save()

    return Response({
        'success': True,
        'new_reservation': ReservationSerializer(reservation).data,
        'confirmation_message': 'Your flight has been changed successfully.',
    })


@api_view(['GET'])
def get_alternative_flights_view(request):
    """Get alternative flight options."""
    origin = request.query_params.get('origin', '')
    destination = request.query_params.get('destination', '')
    date = request.query_params.get('date', '')

    if not all([origin, destination, date]):
        return Response(
            {'error': 'origin, destination, and date are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    flights = get_alternative_flights(origin, destination, date)
    return Response({'flights': flights})


@api_view(['POST'])
def synthesize_voice(request):
    """Synthesize text to speech."""
    text = request.data.get('text', '')
    language = request.data.get('language', 'en')

    if not text:
        return Response(
            {'error': 'text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = elevenlabs_service.synthesize(text, language)
    return Response(result)


@api_view(['POST'])
def create_helper_link(request):
    """Create a shareable helper link for family assistance."""
    session_id = request.data.get('session_id')

    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not session.helper_link:
        session.helper_link = secrets.token_urlsafe(8)
        session.save()

    return Response({
        'helper_link': session.helper_link,
        'expires_at': session.expires_at.isoformat(),
    })


@api_view(['GET'])
def get_helper_session(request, link_id):
    """Get session for family helper view."""
    try:
        session = Session.objects.get(helper_link=link_id)
    except Session.DoesNotExist:
        return Response(
            {'error': 'Helper link not found or expired'},
            status=status.HTTP_404_NOT_FOUND
        )

    if session.expires_at < timezone.now():
        return Response(
            {'error': 'Helper link has expired'},
            status=status.HTTP_410_GONE
        )

    reservation_data = None
    if session.reservation:
        reservation_data = ReservationSerializer(session.reservation).data

    messages = MessageSerializer(session.messages.all(), many=True).data

    return Response({
        'session': SessionSerializer(session).data,
        'reservation': reservation_data,
        'messages': messages,
    })


@api_view(['POST'])
def send_helper_suggestion(request, link_id):
    """Send a suggestion from family helper."""
    try:
        session = Session.objects.get(helper_link=link_id)
    except Session.DoesNotExist:
        return Response(
            {'error': 'Helper link not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    message_text = request.data.get('message', '').strip()
    if not message_text:
        return Response(
            {'error': 'message is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create family message
    Message.objects.create(
        session=session,
        role='family',
        content=message_text,
    )

    return Response({'success': True})


@api_view(['GET'])
def health_check(request):
    """Health check endpoint for deployment monitoring."""
    from django.db import connection
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'service': 'AA Voice Concierge API'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# ==================== Flight-Engine API Endpoints ====================

@api_view(['GET'])
def get_airports(request):
    """
    Get airport information.

    Query params:
        code: Single airport IATA code (e.g., 'DFW')
        If no code provided, returns all airports.
    """
    code = request.query_params.get('code')

    if code:
        airport = get_airport_info(code)
        if airport:
            return Response(airport)
        return Response(
            {'error': f'Airport not found: {code}'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Return all airports
    airports = get_all_airports()
    return Response(airports)


@api_view(['GET'])
def get_flights(request):
    """
    Get flights using AA Flight-Engine API.

    Query params:
        date: Required. Date in YYYY-MM-DD format
        origin: Optional. Filter by origin airport code
        destination: Optional. Filter by destination airport code
        flightNumber: Optional. Filter by flight number
    """
    date = request.query_params.get('date')

    if not date:
        return Response(
            {'error': 'date parameter is required (YYYY-MM-DD format)'},
            status=status.HTTP_400_BAD_REQUEST
        )

    origin = request.query_params.get('origin')
    destination = request.query_params.get('destination')
    flight_number = request.query_params.get('flightNumber')

    # If origin and destination provided, use alternative flights function
    if origin and destination:
        flights = get_alternative_flights(origin, destination, date)
    else:
        flights = get_flights_for_date(date)

        # Apply filters
        if origin:
            flights = [f for f in flights if f.get('origin', '').upper() == origin.upper()]
        if destination:
            flights = [f for f in flights if f.get('destination', '').upper() == destination.upper()]
        if flight_number:
            # Strip 'AA' prefix if present
            fn = flight_number.upper()
            if fn.startswith('AA'):
                fn = fn[2:]
            flights = [f for f in flights if fn in f.get('flight_number', '')]

    return Response({'flights': flights, 'count': len(flights)})


@api_view(['GET'])
def search_flights(request):
    """
    Search for flights between two airports (convenience endpoint).

    Query params:
        origin: Required. Origin airport code
        destination: Required. Destination airport code
        date: Optional. Date in YYYY-MM-DD format (defaults to tomorrow)
    """
    origin = request.query_params.get('origin')
    destination = request.query_params.get('destination')
    date = request.query_params.get('date')

    if not origin or not destination:
        return Response(
            {'error': 'origin and destination parameters are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not date:
        from datetime import datetime, timedelta
        date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

    flights = get_alternative_flights(origin.upper(), destination.upper(), date)

    return Response({
        'origin': origin.upper(),
        'destination': destination.upper(),
        'date': date,
        'flights': flights,
        'count': len(flights)
    })
