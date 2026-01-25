"""API views for AA Voice Concierge."""

import uuid
import secrets
from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import Session, Message, Reservation, Passenger, Flight, FlightSegment
from .serializers import (
    ReservationSerializer,
    SessionSerializer,
    MessageSerializer,
    PassengerSerializer,
    FlightSerializer,
    FlightSegmentSerializer,
)
from .services import GeminiService, ElevenLabsService, retell_service, resend_service
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

    # Get language hint from session context
    language_hint = session.context.get('detected_language') if session.context else None

    # Process with Gemini
    ai_response = gemini_service.process_message(
        user_message=transcript,
        conversation_history=messages,
        reservation_context=reservation_context,
        session_state=session.state,
        language_hint=language_hint,
    )

    reply = ai_response['reply']
    intent = ai_response['intent']
    entities = ai_response['entities']
    action = ai_response.get('action', 'none')
    detected_language = ai_response.get('detected_language', 'en')

    # Store detected language in session context
    if not session.context:
        session.context = {}
    session.context['detected_language'] = detected_language
    session.save()

    # Handle specific intents
    flight_options = []
    suggested_actions = []
    email_sent = False

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

        # Generate trip summary using Gemini
        trip_summary = None
        
        if session.reservation:
            reservation_data = ReservationSerializer(session.reservation).data
            summary_result = gemini_service.generate_trip_summary(
                reservation_data=reservation_data,
                language=detected_language
            )
            trip_summary = summary_result.get('summary', '')

            # Send booking confirmation email
            reservation = session.reservation
            if reservation.passenger and reservation.passenger.email:
                passenger = reservation.passenger
                passenger_name = f"{passenger.first_name} {passenger.last_name}"
                
                # Build flight details from reservation
                flight_details = []
                for segment in reservation.flight_segments.all():
                    flight = segment.flight
                    flight_details.append({
                        'flight_number': flight.flight_number,
                        'origin': flight.origin,
                        'destination': flight.destination,
                        'departure_time': flight.departure_time.isoformat() if flight.departure_time else '',
                        'arrival_time': flight.arrival_time.isoformat() if flight.arrival_time else '',
                        'gate': flight.gate or 'TBD',
                        'seat': segment.seat or 'Not assigned',
                        'status': flight.status,
                    })
                
                # Send email via Resend
                email_result = resend_service.send_booking_confirmation(
                    to_email=passenger.email,
                    passenger_name=passenger_name,
                    confirmation_code=reservation.confirmation_code,
                    flight_details=flight_details,
                    language=detected_language
                )
                email_sent = email_result is not None

            if trip_summary:
                reply = trip_summary
            elif detected_language == 'es':
                reply = "¡Perfecto! Todo listo. Su nuevo vuelo ha sido reservado. Le envío los detalles a su correo. ¿Hay algo más en que pueda ayudarle?"
            else:
                reply = "Perfect! You're all set. Your new flight has been booked. I'm sending the details to your email. Is there anything else I can help with?"
        else:
            if detected_language == 'es':
                reply = "¡Perfecto! Todo listo. ¿Hay algo más en que pueda ayudarle?"
            else:
                reply = "Perfect! You're all set. Is there anything else I can help with?"

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

    # Generate audio response with appropriate language voice
    audio_response = elevenlabs_service.synthesize(reply, language=detected_language)
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
        'detected_language': detected_language,
    }

    if session.reservation:
        response_data['reservation'] = ReservationSerializer(session.reservation).data

    if flight_options:
        response_data['flight_options'] = flight_options

    # Include email_sent flag if booking was confirmed
    if intent == 'confirm_action' and session.state == 'complete':
        response_data['email_sent'] = email_sent

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
    original_flight_data = request.data.get('original_flight')
    new_flight_data = request.data.get('new_flight')

    try:
        session = Session.objects.get(id=session_id)
        reservation = Reservation.objects.get(id=reservation_id)
    except (Session.DoesNotExist, Reservation.DoesNotExist):
        return Response(
            {'error': 'Session or reservation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get language preference from session
    language = session.context.get('detected_language', 'en') if session.context else 'en'

    # For demo, just update the status
    reservation.status = 'changed'
    reservation.save()

    session.state = 'complete'
    session.save()

    # Generate change summary using Gemini
    change_summary = None
    if original_flight_data and new_flight_data:
        summary_result = gemini_service.generate_change_summary(
            original_flight=original_flight_data,
            new_flight=new_flight_data,
            language=language
        )
        change_summary = summary_result.get('summary', '')

    confirmation_message = change_summary or (
        'Su vuelo ha sido cambiado exitosamente.' if language == 'es'
        else 'Your flight has been changed successfully.'
    )

    # Generate audio for confirmation
    audio_response = elevenlabs_service.synthesize(confirmation_message, language=language)
    audio_url = audio_response.get('audio_url') if audio_response else None

    # Send confirmation email via Resend
    email_sent = False
    if reservation.passenger and reservation.passenger.email:
        passenger = reservation.passenger
        passenger_name = f"{passenger.first_name} {passenger.last_name}"
        
        if original_flight_data and new_flight_data:
            # Send flight change confirmation email
            email_result = resend_service.send_flight_change_confirmation(
                to_email=passenger.email,
                passenger_name=passenger_name,
                confirmation_code=reservation.confirmation_code,
                original_flight=original_flight_data,
                new_flight=new_flight_data,
                language=language
            )
            email_sent = email_result is not None

    return Response({
        'success': True,
        'new_reservation': ReservationSerializer(reservation).data,
        'confirmation_message': confirmation_message,
        'audio_url': audio_url,
        'detected_language': language,
        'email_sent': email_sent,
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


# ==================== Retell AI Voice Agent Endpoints ====================

@api_view(['GET'])
def retell_status(request):
    """Check Retell AI configuration status."""
    return Response({
        'configured': retell_service.is_configured(),
        'service': 'Retell AI Voice Agent',
    })


@api_view(['POST'])
def retell_create_agent(request):
    """Create a new Retell voice agent."""
    agent_name = request.data.get('agent_name', 'AA Voice Concierge')
    voice_id = request.data.get('voice_id', 'eleven_labs_rachel')
    llm_websocket_url = request.data.get('llm_websocket_url')

    result = retell_service.create_agent(
        agent_name=agent_name,
        voice_id=voice_id,
        llm_websocket_url=llm_websocket_url,
    )

    if result:
        return Response(result, status=status.HTTP_201_CREATED)
    return Response(
        {'error': 'Failed to create agent. Check API key configuration.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


@api_view(['GET'])
def retell_list_agents(request):
    """List all configured Retell agents."""
    agents = retell_service.list_agents()

    if agents is not None:
        return Response({'agents': agents})
    return Response(
        {'error': 'Failed to list agents. Check API key configuration.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


@api_view(['GET'])
def retell_get_agent(request, agent_id):
    """Get details for a specific Retell agent."""
    agent = retell_service.get_agent(agent_id)

    if agent:
        return Response(agent)
    return Response(
        {'error': 'Agent not found'},
        status=status.HTTP_404_NOT_FOUND
    )


@api_view(['POST'])
def retell_create_web_call(request):
    """
    Create a web call for browser-based real-time voice interaction.
    Returns access_token for WebSocket connection.
    """
    agent_id = request.data.get('agent_id')
    session_id = request.data.get('session_id')

    if not agent_id:
        return Response(
            {'error': 'agent_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Include session metadata for context
    metadata = {}
    if session_id:
        try:
            session = Session.objects.get(id=session_id)
            metadata['session_id'] = str(session.id)
            metadata['state'] = session.state
            if session.reservation:
                metadata['confirmation_code'] = session.reservation.confirmation_code
        except Session.DoesNotExist:
            pass

    result = retell_service.create_web_call(
        agent_id=agent_id,
        metadata=metadata if metadata else None,
    )

    if result:
        return Response(result, status=status.HTTP_201_CREATED)
    return Response(
        {'error': 'Failed to create web call'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


@api_view(['POST'])
def retell_create_phone_call(request):
    """Initiate an outbound phone call using Retell agent."""
    agent_id = request.data.get('agent_id')
    to_number = request.data.get('to_number')
    from_number = request.data.get('from_number')

    if not agent_id or not to_number:
        return Response(
            {'error': 'agent_id and to_number are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = retell_service.create_phone_call(
        agent_id=agent_id,
        to_number=to_number,
        from_number=from_number,
    )

    if result:
        return Response(result, status=status.HTTP_201_CREATED)
    return Response(
        {'error': 'Failed to create phone call'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


@api_view(['GET'])
def retell_get_call(request, call_id):
    """Get details and transcript for a Retell call."""
    call = retell_service.get_call(call_id)

    if call:
        return Response(call)
    return Response(
        {'error': 'Call not found'},
        status=status.HTTP_404_NOT_FOUND
    )


@api_view(['POST'])
def retell_end_call(request, call_id):
    """End an active Retell call."""
    success = retell_service.end_call(call_id)

    if success:
        return Response({'success': True})
    return Response(
        {'error': 'Failed to end call'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


# ==================== Email Endpoints (Resend) ====================

@api_view(['GET'])
def email_status(request):
    """Check Resend email service configuration status."""
    return Response({
        'configured': resend_service.is_configured(),
        'service': 'Resend Email Service',
    })


@api_view(['POST'])
def send_booking_confirmation_email(request):
    """
    Send a booking confirmation email to a passenger.

    Request body:
        reservation_id: UUID of the reservation
        language: Optional language code ('en' or 'es'), defaults to 'en'
    """
    reservation_id = request.data.get('reservation_id')
    language = request.data.get('language', 'en')

    if not reservation_id:
        return Response(
            {'error': 'reservation_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        reservation = Reservation.objects.select_related('passenger').prefetch_related(
            'flight_segments__flight'
        ).get(id=reservation_id)
    except Reservation.DoesNotExist:
        return Response(
            {'error': 'Reservation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not reservation.passenger or not reservation.passenger.email:
        return Response(
            {'error': 'Passenger email not available'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Build flight details from flight segments
    flight_details = []
    for segment in reservation.flight_segments.all():
        flight = segment.flight
        flight_details.append({
            'flight_number': flight.flight_number,
            'origin': flight.origin,
            'destination': flight.destination,
            'departure_time': flight.departure_time.isoformat() if flight.departure_time else '',
            'arrival_time': flight.arrival_time.isoformat() if flight.arrival_time else '',
            'gate': flight.gate or 'TBD',
            'seat': segment.seat or 'Not assigned',
            'status': flight.status,
        })

    passenger = reservation.passenger
    passenger_name = f"{passenger.first_name} {passenger.last_name}"

    # Send email
    result = resend_service.send_booking_confirmation(
        to_email=passenger.email,
        passenger_name=passenger_name,
        confirmation_code=reservation.confirmation_code,
        flight_details=flight_details,
        language=language
    )

    if result:
        return Response({
            'success': True,
            'message': f'Confirmation email sent to {passenger.email}',
            'email_id': result.get('id'),
        })
    return Response(
        {'error': 'Failed to send email. Check Resend configuration.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


@api_view(['POST'])
def send_flight_change_email(request):
    """
    Send a flight change confirmation email to a passenger.

    Request body:
        reservation_id: UUID of the reservation
        original_flight: Dict with original flight details
        new_flight: Dict with new flight details
        language: Optional language code ('en' or 'es'), defaults to 'en'
    """
    reservation_id = request.data.get('reservation_id')
    original_flight = request.data.get('original_flight')
    new_flight = request.data.get('new_flight')
    language = request.data.get('language', 'en')

    if not reservation_id:
        return Response(
            {'error': 'reservation_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not original_flight or not new_flight:
        return Response(
            {'error': 'original_flight and new_flight are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        reservation = Reservation.objects.select_related('passenger').get(id=reservation_id)
    except Reservation.DoesNotExist:
        return Response(
            {'error': 'Reservation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not reservation.passenger or not reservation.passenger.email:
        return Response(
            {'error': 'Passenger email not available'},
            status=status.HTTP_400_BAD_REQUEST
        )

    passenger = reservation.passenger
    passenger_name = f"{passenger.first_name} {passenger.last_name}"

    # Send email
    result = resend_service.send_flight_change_confirmation(
        to_email=passenger.email,
        passenger_name=passenger_name,
        confirmation_code=reservation.confirmation_code,
        original_flight=original_flight,
        new_flight=new_flight,
        language=language
    )

    if result:
        return Response({
            'success': True,
            'message': f'Flight change confirmation email sent to {passenger.email}',
            'email_id': result.get('id'),
        })
    return Response(
        {'error': 'Failed to send email. Check Resend configuration.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


# ==================== CRUD ViewSets ====================

class PassengerViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Passengers.

    list:   GET /api/passengers/
    create: POST /api/passengers/
    read:   GET /api/passengers/{id}/
    update: PUT /api/passengers/{id}/
    patch:  PATCH /api/passengers/{id}/
    delete: DELETE /api/passengers/{id}/
    """
    queryset = Passenger.objects.all()
    serializer_class = PassengerSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['language_preference', 'seat_preference']
    search_fields = ['first_name', 'last_name', 'email', 'aadvantage_number']
    ordering_fields = ['first_name', 'last_name', 'email']
    ordering = ['last_name', 'first_name']


class FlightViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Flights.

    list:   GET /api/flights-db/
    create: POST /api/flights-db/
    read:   GET /api/flights-db/{id}/
    update: PUT /api/flights-db/{id}/
    patch:  PATCH /api/flights-db/{id}/
    delete: DELETE /api/flights-db/{id}/
    """
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['origin', 'destination', 'status', 'flight_number']
    search_fields = ['flight_number', 'origin', 'destination']
    ordering_fields = ['departure_time', 'arrival_time', 'flight_number']
    ordering = ['departure_time']


class ReservationViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Reservations.

    list:   GET /api/reservations/
    create: POST /api/reservations/
    read:   GET /api/reservations/{id}/
    update: PUT /api/reservations/{id}/
    patch:  PATCH /api/reservations/{id}/
    delete: DELETE /api/reservations/{id}/
    """
    queryset = Reservation.objects.select_related('passenger').prefetch_related('flight_segments__flight').all()
    serializer_class = ReservationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'confirmation_code']
    search_fields = ['confirmation_code', 'passenger__first_name', 'passenger__last_name', 'passenger__email']
    ordering_fields = ['created_at', 'updated_at', 'confirmation_code']
    ordering = ['-created_at']


class FlightSegmentViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Flight Segments.

    list:   GET /api/flight-segments/
    create: POST /api/flight-segments/
    read:   GET /api/flight-segments/{id}/
    update: PUT /api/flight-segments/{id}/
    patch:  PATCH /api/flight-segments/{id}/
    delete: DELETE /api/flight-segments/{id}/
    """
    queryset = FlightSegment.objects.select_related('reservation', 'flight').all()
    serializer_class = FlightSegmentSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['reservation', 'flight']
    ordering_fields = ['segment_order']
    ordering = ['segment_order']


class SessionViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Sessions.

    list:   GET /api/sessions/
    create: POST /api/sessions/
    read:   GET /api/sessions/{id}/
    update: PUT /api/sessions/{id}/
    patch:  PATCH /api/sessions/{id}/
    delete: DELETE /api/sessions/{id}/
    """
    queryset = Session.objects.select_related('reservation').prefetch_related('messages').all()
    serializer_class = SessionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['state', 'helper_link']
    search_fields = ['helper_link']
    ordering_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']


class MessageViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for Messages.

    list:   GET /api/messages/
    create: POST /api/messages/
    read:   GET /api/messages/{id}/
    update: PUT /api/messages/{id}/
    patch:  PATCH /api/messages/{id}/
    delete: DELETE /api/messages/{id}/
    """
    queryset = Message.objects.select_related('session').all()
    serializer_class = MessageSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['session', 'role', 'intent']
    search_fields = ['content', 'intent']
    ordering_fields = ['timestamp']
    ordering = ['timestamp']


# ==================== Retell Webhook Endpoints ====================

from .services.retell_webhook_handler import retell_webhook_handler, RETELL_FUNCTION_DEFINITIONS


@api_view(['POST'])
def retell_webhook(request):
    """
    Main webhook endpoint for Retell AI events.

    Retell sends events here for:
    - call_started: New call initiated
    - call_ended: Call completed
    - call_analyzed: Post-call analysis ready
    - function_call: Agent requesting to call a function

    Configure this URL in Retell dashboard:
    https://yourdomain.com/api/retell/webhook
    """
    # Verify signature (optional but recommended for production)
    signature = request.headers.get('X-Retell-Signature', '')

    event_type = request.data.get('event')
    data = request.data

    if not event_type:
        return Response(
            {'error': 'Missing event type'},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = retell_webhook_handler.handle_webhook(event_type, data)

    return Response(result)


@api_view(['POST'])
def retell_function_call(request):
    """
    Direct function call endpoint for Retell agent.

    This endpoint can be called directly by Retell when using
    the "external function" feature. Configure functions in
    the Retell dashboard with this URL.

    URL: https://yourdomain.com/api/retell/function/{function_name}
    """
    function_name = request.data.get('function_name')
    arguments = request.data.get('arguments', {})
    call_id = request.data.get('call_id', '')

    if not function_name:
        return Response(
            {'error': 'Missing function_name'},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = retell_webhook_handler._handle_function_call({
        'function_name': function_name,
        'arguments': arguments,
        'call_id': call_id,
    })

    return Response(result)


@api_view(['GET'])
def retell_function_definitions(request):
    """
    Get the function definitions for Retell agent configuration.

    Use these definitions when setting up your Retell agent
    to enable function calling capabilities.
    """
    return Response({
        'functions': RETELL_FUNCTION_DEFINITIONS,
        'webhook_url': request.build_absolute_uri('/api/retell/webhook'),
        'function_url': request.build_absolute_uri('/api/retell/function'),
    })
