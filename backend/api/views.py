"""API views for Elder Strolls."""

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
import re

from .models import Session, Message, Reservation, Passenger, Flight, FlightSegment, FamilyAction, PassengerLocation, LocationAlert
from .serializers import (
    ReservationSerializer,
    SessionSerializer,
    MessageSerializer,
    PassengerSerializer,
    FlightSerializer,
    FlightSegmentSerializer,
    FamilyActionSerializer,
    ChangeFlightActionSerializer,
    CancelFlightActionSerializer,
    SelectSeatActionSerializer,
    AddBagsActionSerializer,
    RequestWheelchairActionSerializer,
    LocationUpdateRequestSerializer,
    TriggerLocationAlertSerializer,
    LocationAlertSerializer,
)
from .services import GeminiService, ElevenLabsService, retell_service, reservation_service
from .services.family_action_service import family_action_service
from .services.location_service import location_service
from .services.location_alert_service import location_alert_service
from .mock_data import (
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


def lookup_reservation_by_code(confirmation_code: str):
    """
    Look up a reservation by confirmation code from the database.
    
    Args:
        confirmation_code: 6-character confirmation code
        
    Returns:
        Reservation object or None if not found
    """
    return reservation_service.lookup_reservation(confirmation_code=confirmation_code)


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

    greeting = "Hi! I'm your Elder Strolls assistant. I'm here to help with your trip. What do you need today?"

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

def verify_identity(session, transcript, target_intent, entities=None):
    """
    Verifies identity using Gemini service extraction capabilities.
    
    Args:
        session: The current session object
        transcript: The user's spoken text
        target_intent: 'change_flight' or 'confirm_booking'
        entities: Dict of entities extracted by Gemini (optional)
    """
    if entities is None:
        entities = {}
        
    transcript_lower = transcript.strip().lower()
    
    # CASE 1: Changing a Flight (High Security: Name + Code)
    if target_intent == 'change_flight':
        if not session.reservation or not session.reservation.passenger:
             return False, "I can't verify you because I don't have a reservation loaded. Please provide your confirmation code first."

        passenger = session.reservation.passenger
        truth_first = passenger.first_name.lower()
        truth_last = passenger.last_name.lower()
        truth_code = session.reservation.confirmation_code.lower()

        # 1. Extract Code (Use GeminiService's robust method)
        # This handles "D as in Delta", "D-E-M-O", etc.
        input_code = gemini_service.extract_confirmation_code(transcript)
        
        # Fallback: Check if Gemini extracted it as an entity
        if not input_code and entities.get('confirmation_code'):
            input_code = entities.get('confirmation_code')

        # 2. Extract Names (Prioritize Gemini Entities, Fallback to Substring)
        input_first = entities.get('first_name', '').lower()
        input_last = entities.get('last_name', '').lower()

        # Check First Name
        has_first = (input_first == truth_first) or (truth_first in transcript_lower)
        
        # Check Last Name
        has_last = (input_last == truth_last) or (truth_last in transcript_lower)

        # Check Code
        has_code = input_code and (input_code.lower() == truth_code)

        if has_first and has_last and has_code:
            return True, "Identity verified. Proceeding with your change."
        
        # Detailed error handling
        missing = []
        if not (has_first and has_last): missing.append("full name")
        if not has_code: missing.append("confirmation code")
        return False, f"I couldn't verify that. Please clearly state your {' and '.join(missing)}."

    # CASE 2: Booking a New Flight (Medium Security: Name Only)
    elif target_intent == 'confirm_booking':
        # Check if we have entities from Gemini
        input_first = entities.get('first_name', '').lower()
        input_last = entities.get('last_name', '').lower()
        
        # If we have a reservation context, verify against it
        if session.reservation and session.reservation.passenger:
            p = session.reservation.passenger
            truth_first = p.first_name.lower()
            truth_last = p.last_name.lower()
            
            has_first = (input_first == truth_first) or (truth_first in transcript_lower)
            has_last = (input_last == truth_last) or (truth_last in transcript_lower)
            
            if has_first and has_last:
                return True, "Identity confirmed."
        
        # If no reservation context, just ensure names were provided/extracted
        # (This prevents confirming empty/garbage input)
        elif input_first and input_last:
            return True, "Identity confirmed."
        elif "my name is" in transcript_lower:
            return True, "Identity confirmed."
            
        return False, "Before I confirm this booking, I need your First and Last name."

    return False, "I couldn't verify your identity."

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
        # Use select_related and prefetch_related to avoid N+1 queries
        session = Session.objects.select_related(
            'reservation__passenger'
        ).prefetch_related(
            'reservation__flight_segments__flight'
        ).get(id=session_id)
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

    # ---------------------------------------------------------
    # 1. VERIFICATION GATEKEEPER
    # ---------------------------------------------------------
    if session.state == 'verifying_identity':
        target_intent = session.context.get('target_intent')
        
        # Run the verification helper with entities
        is_verified, verify_msg = verify_identity(session, transcript, target_intent, entities=entities)
        
        if is_verified:
            session.context['is_verified'] = True
            # Restore state based on what they wanted to do
            if target_intent == 'change_flight':
                session.state = 'changing'
                intent = 'change_flight' # Proceed immediately to change logic
            elif target_intent == 'confirm_booking':
                session.state = 'booking'
                intent = 'confirm_action' # Proceed immediately to booking logic
        else:
            # Verification Failed - Ask again
            reply = verify_msg
            audio_response = elevenlabs_service.synthesize(reply, language=detected_language)
            Message.objects.create(session=session, role='assistant', content=reply, audio_url=audio_response.get('audio_url'))
            return Response({
                'reply': reply, 
                'audio_url': audio_response.get('audio_url'), 
                'session_state': session.state
            })
    # Try to extract confirmation code if in lookup state
    if session.state in ['greeting', 'lookup'] and not session.reservation:
        code = gemini_service.extract_confirmation_code(transcript)
        if code:
            reservation = lookup_reservation_by_code(code)
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
    elif intent == 'change_flight':
        if session.reservation:
            # CHECK 1: Are they verified? (High Security)
            if not session.context.get('is_verified'):
                session.state = 'verifying_identity'
                session.context['target_intent'] = 'change_flight'
                session.save()
                reply = "For security, please state your First Name, Last Name, and Confirmation Code to verify this change."
            
            else:
                # Verified -> Show Options
                session.state = 'changing'
                
                # [Your existing logic to get flights goes here]
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
                        time1 = parse(opt1['departure_time']).strftime('%I:%M %p')
                        reply = f"I found some flights for you. There's one at {time1}. Would you like me to book that for you?"

                        session.context['original_flight'] = {
                            'flight_number': first_segment.flight.flight_number,
                            'origin': first_segment.flight.origin,
                            'destination': first_segment.flight.destination,
                            'departure_time': first_segment.flight.departure_time.isoformat(),
                            'arrival_time': first_segment.flight.arrival_time.isoformat() if first_segment.flight.arrival_time else '',
                            'seat': first_segment.seat or 'Not assigned',
                        }
                        session.context['new_flight'] = opt1
                session.save()
        else:
            # HANDLE MISSING RESERVATION
            reply = "I can help change your flight, but I need to find it first. What is your 6-letter confirmation code?"
            session.state = 'lookup' # Force next message to be treated as a code
            session.save()

    # Handle confirmation
    elif intent == 'confirm_action' and session.state == 'changing':
        session.state = 'complete'
        session.save()

        # Get the original and new flight from session context
        original_flight = session.context.get('original_flight', {})
        new_flight = session.context.get('new_flight', {})

        # Generate change summary using Gemini (with correct new flight data)
        trip_summary = None

        if session.reservation and new_flight:
            # Actually persist the flight change to the database
            updated_reservation = reservation_service.change_flight(
                reservation_id=str(session.reservation.id),
                segment_order=0,  # Change the first flight segment
                new_flight_data=new_flight,
                new_seat=new_flight.get('seat')
            )
            
            # Refresh the reservation reference
            if updated_reservation:
                session.reservation = updated_reservation
                session.save()

            summary_result = gemini_service.generate_change_summary(
                original_flight=original_flight,
                new_flight=new_flight,
                language=detected_language
            )
            trip_summary = summary_result.get('summary', '')

            # Send flight CHANGE confirmation email (not booking)
            reservation = session.reservation
            if reservation.passenger and reservation.passenger.email:
                passenger = reservation.passenger
                passenger_name = f"{passenger.first_name} {passenger.last_name}"

                email_sent = True

            if trip_summary:
                reply = trip_summary
            elif detected_language == 'es':
                reply = "¡Perfecto! Todo listo. Su vuelo ha sido cambiado. Le envío los detalles a su correo. ¿Hay algo más en que pueda ayudarle?"
            else:
                reply = "Perfect! You're all set. Your flight has been changed. I'm sending the details to your email. Is there anything else I can help with?"
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
    """Look up a reservation by confirmation code, name, or email from the database."""
    code = request.query_params.get('confirmation_code', '').strip()
    last_name = request.query_params.get('last_name', '').strip()
    email = request.query_params.get('email', '').strip()

    # Use the reservation service to look up from database
    reservation = reservation_service.lookup_reservation(
        confirmation_code=code if code else None,
        last_name=last_name if last_name else None,
        email=email if email else None
    )

    if reservation:
        return Response({'reservation': ReservationSerializer(reservation).data})

    return Response(
        {'error': 'Reservation not found'},
        status=status.HTTP_404_NOT_FOUND
    )


@api_view(['POST'])
def create_reservation(request):
    """
    Create a new reservation with passenger and flight information.

    Request body:
        confirmation_code: 6-character confirmation code
        passenger: {
            first_name: str,
            last_name: str,
            email: str,
            phone: str (optional),
            language_preference: 'en' or 'es' (optional),
            seat_preference: 'window', 'aisle', or 'middle' (optional)
        }
        flights: [
            {
                flight_number: str,
                origin: str (airport code),
                destination: str (airport code),
                departure_time: ISO datetime str,
                arrival_time: ISO datetime str,
                gate: str (optional),
                seat: str (optional),
                status: str (optional, defaults to 'scheduled')
            }
        ]
    """
    confirmation_code = request.data.get('confirmation_code')
    passenger_data = request.data.get('passenger')
    flights_data = request.data.get('flights', [])

    # Validation
    if not confirmation_code:
        return Response(
            {'error': 'confirmation_code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not passenger_data or not passenger_data.get('email'):
        return Response(
            {'error': 'passenger with email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not flights_data:
        return Response(
            {'error': 'At least one flight is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if confirmation code already exists
    existing = reservation_service.lookup_reservation(confirmation_code=confirmation_code)
    if existing:
        return Response(
            {'error': f'Reservation with code {confirmation_code} already exists'},
            status=status.HTTP_409_CONFLICT
        )

    # Create the reservation
    reservation = reservation_service.create_reservation(
        confirmation_code=confirmation_code,
        passenger_data=passenger_data,
        flight_segments=flights_data
    )

    if reservation:
        return Response({
            'success': True,
            'reservation': ReservationSerializer(reservation).data
        }, status=status.HTTP_201_CREATED)

    return Response(
        {'error': 'Failed to create reservation'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


@api_view(['POST'])
def change_reservation(request):
    """Change a flight reservation and persist to database."""
    session_id = request.data.get('session_id')
    reservation_id = request.data.get('reservation_id')
    new_flight_id = request.data.get('new_flight_id')
    original_flight_data = request.data.get('original_flight')
    new_flight_data = request.data.get('new_flight')
    segment_order = request.data.get('segment_order', 0)  # Which flight segment to change

    try:
        session = Session.objects.get(id=session_id)
        reservation = Reservation.objects.select_related('passenger').prefetch_related(
            'flight_segments__flight'
        ).get(id=reservation_id)
    except (Session.DoesNotExist, Reservation.DoesNotExist):
        return Response(
            {'error': 'Session or reservation not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get language preference from session
    language = session.context.get('detected_language', 'en') if session.context else 'en'

    # Actually change the flight in the database using the reservation service
    if new_flight_data:
        updated_reservation = reservation_service.change_flight(
            reservation_id=str(reservation_id),
            segment_order=segment_order,
            new_flight_data=new_flight_data,
            new_seat=new_flight_data.get('seat')
        )
        if updated_reservation:
            reservation = updated_reservation
        else:
            # Fallback: just update status if flight change failed
            reservation.status = 'changed'
            reservation.save()
    else:
        # No new flight data provided, just update status
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
           
            email_sent = True

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
    """Create a shareable helper link for family assistance.

    Request body:
        session_id: UUID of the session
        mode: 'session' (30 min expiry), 'persistent' (until flight departure), or 'demo' (2 hours)
    """
    session_id = request.data.get('session_id')
    mode = request.data.get('mode', 'demo')  # Default to demo mode for 2-hour persistence

    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response(
            {'error': 'Session not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not session.helper_link:
        session.helper_link = secrets.token_urlsafe(8)

    # Set helper link mode and expiry
    session.helper_link_mode = mode

    if mode == 'demo':
        # Demo mode: 2 hours from now
        session.helper_link_expires_at = timezone.now() + timedelta(hours=2)
    elif mode == 'persistent' and session.reservation:
        # Set expiry to flight departure time
        first_segment = session.reservation.flight_segments.first()
        if first_segment and first_segment.flight.departure_time:
            session.helper_link_expires_at = first_segment.flight.departure_time
        else:
            # Fallback: 24 hours from now
            session.helper_link_expires_at = timezone.now() + timedelta(hours=24)
    else:
        # Session-based expiry (use session expiry)
        session.helper_link_expires_at = session.expires_at

    session.save()

    return Response({
        'helper_link': session.helper_link,
        'mode': session.helper_link_mode,
        'expires_at': session.helper_link_expires_at.isoformat() if session.helper_link_expires_at else session.expires_at.isoformat(),
    })


@api_view(['GET'])
def get_helper_session(request, link_id):
    """Get session for family helper view.

    Returns session data with available actions and action history.
    For persistent mode, checks helper_link_expires_at instead of session.expires_at.
    """
    try:
        session = Session.objects.get(helper_link=link_id)
    except Session.DoesNotExist:
        return Response(
            {'error': 'Helper link not found or expired'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check expiry based on mode
    # Both 'persistent' and 'demo' modes use helper_link_expires_at
    if session.helper_link_mode in ('persistent', 'demo'):
        expiry_time = session.helper_link_expires_at or session.expires_at
    else:
        expiry_time = session.expires_at

    if expiry_time < timezone.now():
        return Response(
            {'error': 'Helper link has expired'},
            status=status.HTTP_410_GONE
        )

    reservation_data = None
    if session.reservation:
        reservation_data = ReservationSerializer(session.reservation).data

    messages = MessageSerializer(session.messages.all(), many=True).data

    # Get available actions and action history
    available_actions = family_action_service.get_available_actions(session)
    action_history = family_action_service.get_action_history(session)

    # Get context for area mapping detection
    context = session.context if hasattr(session, 'context') else {}

    return Response({
        'session': SessionSerializer(session).data,
        'reservation': reservation_data,
        'messages': messages,
        'available_actions': available_actions,
        'action_history': action_history,
        'helper_link_mode': session.helper_link_mode,
        'helper_link_expires_at': expiry_time.isoformat(),
        'context': context,  # Include context so frontend can detect area mapping
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


def _get_valid_helper_session(link_id: str):
    """Helper function to validate and return session for helper link."""
    try:
        session = Session.objects.get(helper_link=link_id)
    except Session.DoesNotExist:
        return None, Response(
            {'error': 'Helper link not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check expiry based on mode
    # Both 'persistent' and 'demo' modes use helper_link_expires_at
    if session.helper_link_mode in ('persistent', 'demo'):
        expiry_time = session.helper_link_expires_at or session.expires_at
    else:
        expiry_time = session.expires_at

    if expiry_time < timezone.now():
        return None, Response(
            {'error': 'Helper link has expired'},
            status=status.HTTP_410_GONE
        )

    return session, None


@api_view(['GET'])
def get_helper_actions(request, link_id):
    """Get available actions and action history for a helper link."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    available_actions = family_action_service.get_available_actions(session)
    action_history = family_action_service.get_action_history(session)

    return Response({
        'available_actions': available_actions,
        'action_history': action_history,
    })


@api_view(['POST'])
def helper_change_flight(request, link_id):
    """Execute a flight change action from family helper."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    serializer = ChangeFlightActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = family_action_service.execute_change_flight(
        session=session,
        new_flight_id=serializer.validated_data['new_flight_id'],
        notes=serializer.validated_data.get('notes', ''),
    )

    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def helper_cancel_flight(request, link_id):
    """Execute a flight cancellation action from family helper."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    serializer = CancelFlightActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = family_action_service.execute_cancel_flight(
        session=session,
        reason=serializer.validated_data.get('reason', ''),
        notes=serializer.validated_data.get('notes', ''),
    )

    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def helper_select_seat(request, link_id):
    """Execute a seat selection action from family helper."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    serializer = SelectSeatActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = family_action_service.execute_select_seat(
        session=session,
        seat=serializer.validated_data['seat'],
        flight_segment_id=str(serializer.validated_data.get('flight_segment_id', '')) or None,
        notes=serializer.validated_data.get('notes', ''),
    )

    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def helper_add_bags(request, link_id):
    """Execute an add baggage action from family helper."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    serializer = AddBagsActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = family_action_service.execute_add_bags(
        session=session,
        bag_count=serializer.validated_data['bag_count'],
        notes=serializer.validated_data.get('notes', ''),
    )

    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def helper_request_wheelchair(request, link_id):
    """Execute a wheelchair assistance request from family helper."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    serializer = RequestWheelchairActionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = family_action_service.execute_request_wheelchair(
        session=session,
        assistance_type=serializer.validated_data.get('assistance_type', 'wheelchair'),
        notes=serializer.validated_data.get('notes', ''),
    )

    if result.get('success'):
        return Response(result)
    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def helper_get_flights(request, link_id):
    """Get available flights for flight change action."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    if not session.reservation:
        return Response(
            {'error': 'No reservation found'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get the first flight segment to find route
    first_segment = session.reservation.flight_segments.first()
    if not first_segment:
        return Response(
            {'error': 'No flight segment found'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get alternative flights for the day after current flight
    target_date = first_segment.flight.departure_time + timedelta(days=1)

    alternatives = get_alternative_flights(
        first_segment.flight.origin,
        first_segment.flight.destination,
        target_date.strftime('%Y-%m-%d')
    )

    return Response({
        'current_flight': {
            'flight_number': first_segment.flight.flight_number,
            'origin': first_segment.flight.origin,
            'destination': first_segment.flight.destination,
            'departure_time': first_segment.flight.departure_time.isoformat(),
            'arrival_time': first_segment.flight.arrival_time.isoformat() if first_segment.flight.arrival_time else None,
        },
        'alternative_flights': alternatives,
    })


@api_view(['GET'])
def helper_get_seats(request, link_id):
    """Get available seats for seat selection action."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    if not session.reservation:
        return Response(
            {'error': 'No reservation found'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get the first flight segment
    first_segment = session.reservation.flight_segments.first()
    if not first_segment:
        return Response(
            {'error': 'No flight segment found'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Generate mock seat map (in production, this would come from the airline's system)
    # Typical narrowbody aircraft layout: 3-3 configuration
    rows = range(1, 31)
    columns = ['A', 'B', 'C', 'D', 'E', 'F']

    # Simulate some occupied seats
    occupied = {'3A', '3B', '5C', '8F', '12A', '12B', '12C', '15D', '20A', '20F', '25C'}
    current_seat = first_segment.seat

    seats = []
    for row in rows:
        for col in columns:
            seat_id = f"{row}{col}"
            seat_type = 'aisle' if col in ['C', 'D'] else ('window' if col in ['A', 'F'] else 'middle')
            is_exit_row = row in [11, 12, 21]
            is_extra_legroom = row <= 5 or is_exit_row

            seats.append({
                'id': seat_id,
                'row': row,
                'column': col,
                'type': seat_type,
                'available': seat_id not in occupied,
                'is_current': seat_id == current_seat,
                'is_exit_row': is_exit_row,
                'is_extra_legroom': is_extra_legroom,
                'price_difference': 35 if is_extra_legroom else 0,
            })

    return Response({
        'flight_number': first_segment.flight.flight_number,
        'current_seat': current_seat,
        'seats': seats,
        'cabin_config': '3-3',
        'total_rows': 30,
    })


# ==================== IROP (Irregular Operations) Endpoints ====================

@api_view(['GET'])
def get_irop_status(request, link_id):
    """
    Get IROP (Irregular Operations) status for the reservation.

    Returns disruption info, rebooking options, and connection risks.
    """
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    if not session.reservation:
        return Response({
            'has_disruption': False,
            'disruption': None,
            'affected_flights': [],
            'connection_at_risk': False,
            'auto_rebooking_available': False,
            'requires_action': False,
        })

    # Get IROP status from mock data
    from .mock_data import get_irop_status as get_mock_irop_status
    irop_status = get_mock_irop_status(session.reservation.confirmation_code)

    return Response(irop_status)


@api_view(['POST'])
def helper_accept_rebooking(request, link_id):
    """
    Accept an auto-rebooking offer on behalf of the passenger.

    This queues a confirmation request to the passenger via voice assistant.

    Request body:
        rebooking_option_id: ID of the rebooking option to accept
        notes: Optional notes from the family helper
    """
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    rebooking_option_id = request.data.get('rebooking_option_id')
    notes = request.data.get('notes', '')

    if not rebooking_option_id:
        return Response(
            {'error': 'rebooking_option_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not session.reservation:
        return Response(
            {'error': 'No reservation found'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get IROP status to validate the rebooking option
    from .mock_data import get_irop_status as get_mock_irop_status
    irop_status = get_mock_irop_status(session.reservation.confirmation_code)

    if not irop_status.get('has_disruption'):
        return Response(
            {'error': 'No disruption found for this reservation'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Find the selected rebooking option
    disruption = irop_status['disruption']
    selected_option = None
    for opt in disruption.get('rebooking_options', []):
        if opt['option_id'] == rebooking_option_id:
            selected_option = opt
            break

    if not selected_option:
        return Response(
            {'error': 'Invalid rebooking option'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create a family action record
    result = family_action_service.execute_accept_rebooking(
        session=session,
        rebooking_option=selected_option,
        notes=notes,
    )

    if result.get('success'):
        # Add a message to the conversation for the passenger
        Message.objects.create(
            session=session,
            role='family',
            content=f"Your family helper has selected a rebooking option for you: Flight {selected_option['flight_number']} departing at {selected_option['departure_time']}. Please confirm if you'd like to accept this rebooking.",
        )

        return Response(result)

    return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def helper_acknowledge_disruption(request, link_id):
    """
    Acknowledge a flight disruption notification.

    Request body:
        disruption_id: ID of the disruption to acknowledge
        notes: Optional notes from the family helper
    """
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    disruption_id = request.data.get('disruption_id')
    notes = request.data.get('notes', '')

    if not disruption_id:
        return Response(
            {'error': 'disruption_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not session.reservation:
        return Response(
            {'error': 'No reservation found'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create a family action record
    result = family_action_service.execute_acknowledge_disruption(
        session=session,
        disruption_id=disruption_id,
        notes=notes,
    )

    if result.get('success'):
        return Response(result)

    return Response(result, status=status.HTTP_400_BAD_REQUEST)


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
            'service': 'Elder Strolls API'
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
    configured = retell_service.is_configured()
    default_agent_id = None
    
    # If configured, try to get a default agent ID
    if configured:
        agents = retell_service.list_agents()
        if agents and len(agents) > 0:
            # Use the first agent as default
            default_agent_id = agents[0].get('agent_id')
    
    return Response({
        'configured': configured,
        'service': 'Retell AI Voice Agent',
        'default_agent_id': default_agent_id,
    })


@api_view(['POST'])
def retell_create_agent(request):
    """Create a new Retell voice agent."""
    agent_name = request.data.get('agent_name', 'Elder Strolls')
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


# ==================== Outbound Reminder Endpoints ====================

from .services.reminder_service import reminder_service


@api_view(['GET'])
def reminder_status(request):
    """
    Check the status of the reminder service.

    Returns configuration status and upcoming flights that would receive reminders.
    """
    upcoming_departures = reminder_service.get_upcoming_flights(
        minutes_ahead=120,
        reminder_type='departure_1hr'
    )

    upcoming_gate_closings = reminder_service.get_upcoming_flights(
        minutes_ahead=35,
        reminder_type='gate_closing'
    )

    return Response({
        'configured': retell_service.is_configured(),
        'service': 'Outbound Reminder Service',
        'reminder_windows': reminder_service.REMINDER_WINDOWS,
        'upcoming_departures': len(upcoming_departures),
        'upcoming_gate_closings': len(upcoming_gate_closings),
        'flights_preview': upcoming_departures[:5],  # Preview first 5
    })


@api_view(['POST'])
def send_gate_reminders(request):
    """
    Trigger gate closing reminder calls.

    This will call all passengers with flights departing in ~30 minutes.
    Typically run by a scheduled task (cron/celery).

    POST /api/reminders/gate-closing
    """
    results = reminder_service.send_gate_closing_reminders()

    return Response({
        'success': True,
        'calls_initiated': len([r for r in results if r['status'] == 'called']),
        'calls_failed': len([r for r in results if r['status'] == 'failed']),
        'results': results,
    })


@api_view(['POST'])
def send_departure_reminders(request):
    """
    Trigger 1-hour departure reminder calls.

    This will call all passengers with flights departing in ~1 hour.
    Typically run by a scheduled task (cron/celery).

    POST /api/reminders/departure
    """
    results = reminder_service.send_departure_reminders()

    return Response({
        'success': True,
        'calls_initiated': len([r for r in results if r['status'] == 'called']),
        'calls_failed': len([r for r in results if r['status'] == 'failed']),
        'results': results,
    })


@api_view(['POST'])
def send_manual_reminder(request):
    """
    Manually send a reminder call for a specific reservation.

    POST /api/reminders/manual
    {
        "confirmation_code": "DEMO123",
        "reminder_type": "gate_closing"  // or "departure_1hr", "final_boarding"
    }
    """
    confirmation_code = request.data.get('confirmation_code')
    reminder_type = request.data.get('reminder_type', 'gate_closing')

    if not confirmation_code:
        return Response(
            {'error': 'confirmation_code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = reminder_service.send_manual_reminder(
        reservation_code=confirmation_code,
        reminder_type=reminder_type,
    )

    if result:
        return Response({
            'success': True,
            'call_id': result.get('call_id'),
            'message': f'Reminder call initiated for {confirmation_code}',
        })
    else:
        return Response(
            {'error': 'Failed to initiate reminder call. Check phone number and Retell configuration.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_upcoming_flights_for_reminders(request):
    """
    Get list of flights that would receive reminders.

    GET /api/reminders/upcoming?type=gate_closing&minutes=60
    """
    reminder_type = request.query_params.get('type', 'departure_1hr')
    minutes = int(request.query_params.get('minutes', 120))

    flights = reminder_service.get_upcoming_flights(
        minutes_ahead=minutes,
        reminder_type=reminder_type,
    )

    return Response({
        'reminder_type': reminder_type,
        'window_minutes': reminder_service.REMINDER_WINDOWS.get(reminder_type, 60),
        'count': len(flights),
        'flights': flights,
    })


# ==================== Location Tracking Endpoints ====================

@api_view(['POST'])
def update_location(request):
    """
    Update passenger location from mobile device.

    POST /api/location/update
    {
        "session_id": "uuid",
        "latitude": 32.8998,
        "longitude": -97.0403,
        "accuracy": 10.5
    }
    """
    serializer = LocationUpdateRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    session_id = str(serializer.validated_data['session_id'])
    latitude = float(serializer.validated_data['latitude'])
    longitude = float(serializer.validated_data['longitude'])
    accuracy = serializer.validated_data.get('accuracy')

    location = location_service.update_location(
        session_id=session_id,
        lat=latitude,
        lng=longitude,
        accuracy=accuracy,
    )

    alert_result = None
    if location:
        alert_result = location_alert_service.check_and_send_alerts(session_id)

    metrics = location_service.get_location_metrics(session_id)

    return Response({
        'stored': location is not None,
        'location_id': str(location.id) if location else None,
        'metrics': metrics.get('metrics'),
        'alert_status': metrics.get('metrics', {}).get('alert_status'),
        'directions': metrics.get('directions', ''),
        'alert_triggered': alert_result is not None,
    })


@api_view(['POST'])
def create_area_mapping_link(request):
    """Create a helper link specifically for area mapping/navigation.

    This creates a demo helper link (2 hours) that can be used for airport navigation
    and area mapping without requiring a full session.

    Request body (optional):
        airport_code: Airport code (e.g., 'DFW')
        gate: Gate number (e.g., 'B22')
        expires_in_hours: Hours until link expires (default: 2 for demo)
    """
    airport_code = request.data.get('airport_code', 'DFW')
    gate = request.data.get('gate', 'B22')
    expires_in_hours = request.data.get('expires_in_hours', 2)  # Default to 2 hours for demo

    # Create a minimal session for area mapping
    session = Session.objects.create(
        state='viewing',
        helper_link=secrets.token_urlsafe(12),
        helper_link_mode='demo',  # Use demo mode for 2-hour persistence
        helper_link_expires_at=timezone.now() + timedelta(hours=expires_in_hours),
        expires_at=timezone.now() + timedelta(hours=expires_in_hours),
    )
    
    # Store mapping context in session context field if available
    if hasattr(session, 'context'):
        session.context = {
            'purpose': 'area_mapping',
            'airport_code': airport_code,
            'gate': gate,
        }
        session.save()
    
    # Get base URL from request
    base_url = request.build_absolute_uri('/').rstrip('/')
    helper_url = f"{base_url}/help/{session.helper_link}"
    
    return Response({
        'helper_link': session.helper_link,
        'helper_url': helper_url,
        'mode': 'persistent',
        'purpose': 'area_mapping',
        'airport_code': airport_code,
        'gate': gate,
        'expires_at': session.helper_link_expires_at.isoformat(),
    })


@api_view(['GET'])
def get_helper_location(request, link_id):
    """Get location data for family helper dashboard."""
    session, error_response = _get_valid_helper_session(link_id)
    if error_response:
        return error_response

    location_data = location_service.get_location_metrics(str(session.id))

    return Response({
        'passenger_location': location_data.get('passenger_location'),
        'gate_location': location_data.get('gate_location'),
        'metrics': location_data.get('metrics'),
        'directions': location_data.get('directions', ''),
        'message': location_data.get('message', ''),
        'alert': location_data.get('alert'),
    })


@api_view(['POST'])
def trigger_location_alert(request):
    """Manually trigger a location alert."""
    serializer = TriggerLocationAlertSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': 'Invalid request', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    session_id = str(serializer.validated_data['session_id'])
    alert_type = serializer.validated_data.get('alert_type', 'running_late')

    if alert_type == 'urgent':
        result = location_alert_service.send_urgent_alert(session_id, force=True)
    else:
        result = location_alert_service.send_running_late_alert(session_id, force=True)

    if result:
        return Response({
            'success': True,
            'alert_id': result.get('alert_id'),
            'alert_type': result.get('alert_type'),
            'voice_call_sent': result.get('voice_call_sent', False),
            'email_sent': result.get('email_sent', False),
        })

    return Response(
        {'error': 'Failed to trigger alert'},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
def get_location_history(request, session_id):
    """Get location history for a session."""
    limit = int(request.query_params.get('limit', 50))

    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    locations = session.locations.all()[:limit]

    return Response({
        'session_id': str(session_id),
        'count': len(locations),
        'locations': [
            {
                'id': str(loc.id),
                'lat': float(loc.latitude),
                'lng': float(loc.longitude),
                'accuracy': loc.accuracy,
                'timestamp': loc.timestamp.isoformat(),
            }
            for loc in locations
        ],
    })


@api_view(['GET'])
def get_location_alerts(request, session_id):
    """Get location alerts for a session."""
    acknowledged_filter = request.query_params.get('acknowledged')

    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    alerts = session.location_alerts.all()

    if acknowledged_filter is not None:
        is_acknowledged = acknowledged_filter.lower() == 'true'
        alerts = alerts.filter(acknowledged=is_acknowledged)

    return Response({
        'session_id': str(session_id),
        'count': alerts.count(),
        'alerts': LocationAlertSerializer(alerts, many=True).data,
    })


@api_view(['POST'])
def acknowledge_alert(request, alert_id):
    """Acknowledge a location alert."""
    success = location_alert_service.acknowledge_alert(alert_id)

    if success:
        return Response({'success': True})

    return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)


# ==================== ElevenLabs Conversational AI Endpoints ====================

from .services.elevenlabs_webhook_handler import elevenlabs_webhook_handler, ELEVENLABS_SERVER_TOOL_DEFINITIONS


@api_view(['GET'])
def elevenlabs_convai_status(request):
    """
    Check ElevenLabs Conversational AI configuration status.

    Returns whether web calls are configured and ready.
    """
    configured = elevenlabs_service.is_web_configured()

    return Response({
        'configured': configured,
        'service': 'ElevenLabs Conversational AI',
        'agent_id': elevenlabs_service.agent_id if configured else None,
    })


@api_view(['POST'])
def elevenlabs_create_web_call(request):
    """
    Create a web call for browser-based real-time voice interaction.

    Returns signed_url for establishing a WebSocket connection with ElevenLabs.

    Request body (optional):
        agent_id: Override the default agent ID
        session_id: Session ID for context
    """
    agent_id = request.data.get('agent_id')
    session_id = request.data.get('session_id')

    result = elevenlabs_service.get_signed_url(agent_id=agent_id)

    if result:
        response_data = {
            'signed_url': result.get('signed_url'),
            'agent_id': agent_id or elevenlabs_service.agent_id,
        }

        # Include session context if available
        if session_id:
            try:
                session = Session.objects.get(id=session_id)
                response_data['session_id'] = str(session.id)
                response_data['session_state'] = session.state
                if session.reservation:
                    response_data['confirmation_code'] = session.reservation.confirmation_code
            except Session.DoesNotExist:
                pass

        return Response(response_data, status=status.HTTP_201_CREATED)

    return Response(
        {'error': 'Failed to create web call. Check ElevenLabs configuration (API key and agent ID).'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


@api_view(['POST'])
def elevenlabs_server_tool(request):
    """
    Webhook endpoint for ElevenLabs Conversational AI server tools.

    ElevenLabs calls this endpoint when the agent invokes a server tool.
    Configure this URL in the ElevenLabs dashboard for each server tool.

    Request body formats supported:
    1. Standard: {"tool_name": "lookup_reservation", "parameters": {"confirmation_code": "PAPA44"}}
    2. Tool call: {"tool_call": {"name": "lookup_reservation", "parameters": {...}}}
    3. Direct format: {"lookup_reservation": "lookup_reservation", "confirmation_code": "PAPA44"}

    URL: https://yourdomain.com/api/elevenlabs/convai/webhook
    """
    data = request.data
    tool_name = None
    parameters = {}

    # Format 1: Standard format with tool_name and parameters
    if 'tool_name' in data or 'name' in data:
        tool_name = data.get('tool_name') or data.get('name')
        parameters = data.get('parameters') or data.get('args') or {}
    
    # Format 2: Tool call format
    elif 'tool_call' in data:
        tool_call = data['tool_call']
        tool_name = tool_call.get('name')
        parameters = tool_call.get('parameters', {})
    
    # Format 3: Direct format where tool name is a key in the request
    # Example: {"lookup_reservation": "lookup_reservation", "confirmation_code": "PAPA44"}
    else:
        # Check if any key matches a known tool name
        known_tools = [
            'lookup_reservation', 'change_flight', 'create_booking', 'get_flight_options',
            'get_reservation_status', 'get_directions', 'create_family_helper_link',
            'check_flight_delays', 'get_gate_directions', 'request_wheelchair', 'add_bags'
        ]
        
        for tool in known_tools:
            if tool in data:
                tool_name = tool
                # Extract all other keys as parameters (excluding the tool_name key itself)
                parameters = {k: v for k, v in data.items() if k != tool_name}
                break

    if not tool_name:
        return Response(
            {'error': 'Missing tool_name. Request format not recognized.', 'received_data': dict(data)},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = elevenlabs_webhook_handler.handle_server_tool(tool_name, parameters)

    return Response(result)


@api_view(['GET'])
def elevenlabs_server_tool_definitions(request):
    """
    Get the server tool definitions for ElevenLabs agent configuration.

    Use these definitions when setting up your ElevenLabs Conversational AI agent
    to enable server tool capabilities.
    """
    return Response({
        'tools': ELEVENLABS_SERVER_TOOL_DEFINITIONS,
        'webhook_url': request.build_absolute_uri('/api/elevenlabs/convai/webhook'),
    })
