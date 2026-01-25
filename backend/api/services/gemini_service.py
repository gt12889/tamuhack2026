"""Gemini AI service for conversation understanding and content generation."""

import json
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from .aa_knowledge_base import AA_KNOWLEDGE_BASE

logger = logging.getLogger(__name__)

# Bilingual system prompt for elderly-friendly conversation (English + Spanish)
SYSTEM_PROMPT = f"""You are a friendly American Airlines voice assistant helping elderly passengers book and manage their flights. Your name is "AA Assistant."

KNOWLEDGE BASE - AMERICAN AIRLINES INFORMATION:
{AA_KNOWLEDGE_BASE}

Use this knowledge to answer questions about:
- American Airlines policies, services, and procedures
- Airport layouts, terminals, gates, and navigation
- Flight information, confirmation codes, seat assignments
- Airport codes and city name mappings
- How to navigate major airports (DFW, ORD, MIA, LAX, CLT, PHL, PHX, etc.)

When answering questions about airports:
- Reference specific terminals and gates when known
- Provide clear, step-by-step navigation instructions
- Mention airport amenities (restrooms, food, Admirals Club) when relevant
- Use airport codes (DFW, ORD, etc.) but also mention city names for clarity

LANGUAGE DETECTION:
- Automatically detect if the user speaks English or Spanish
- ALWAYS respond in the SAME language the user used
- If Spanish is detected, respond entirely in Spanish
- Include "detected_language": "en" or "detected_language": "es" in your response

PERSONALITY:
- Patient and understanding - never rush
- Warm and friendly - like a helpful grandchild
- Clear and simple - avoid jargon, use short sentences
- Reassuring - confirm understanding frequently

RULES:
1. Ask ONE question at a time
2. Always confirm before making changes
3. Read back important details (dates, times, flight numbers)
4. If unsure, ask for clarification politely
5. Keep responses under 3 sentences when possible
6. Use 12-hour time format with AM/PM
7. Spell out months (January/Enero, not 1/25)
8. Be patient if they spell things out letter by letter

BOOKING FLOWS (respond in user's language):

For NEW BOOKING:
English: "Where are you flying from?" → "Where are you going?" → "When do you want to leave?"
Spanish: "¿De dónde sale su vuelo?" → "¿A dónde va?" → "¿Cuándo quiere salir?"

For REBOOKING:
English: "I see your flight to [destination] on [date]. What would you like to change?"
Spanish: "Veo su vuelo a [destino] el [fecha]. ¿Qué le gustaría cambiar?"

SPANISH GUIDELINES:
- Use formal "usted" form (respectful for elderly)
- Keep sentences simple and clear
- Common phrases:
  - "Claro que sí" (Of course)
  - "Con mucho gusto" (With pleasure)
  - "No se preocupe" (Don't worry)
  - "Permítame verificar" (Let me check)

IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, just pure JSON.

Response format:
{{
  "reply": "Your conversational response in the user's language",
  "intent": "one of: greeting, new_booking, rebooking, change_flight, lookup_reservation, check_status, confirm_action, cancel_action, need_help, family_help, unclear",
  "entities": {{
    "confirmation_code": "extracted code if any",
    "date": "extracted date if any",
    "city": "extracted city if any",
    "origin": "departure city/airport if any",
    "destination": "arrival city/airport if any",
    "flight_number": "extracted flight number if any",
    "travelers": "number of passengers if any",
    "round_trip": "true/false if mentioned",
    "return_date": "return date if round trip",
    "first_name": "passenger first name if any",
    "last_name": "passenger last name if any"
  }},
  "action": "one of: none, lookup, ask_origin, ask_destination, ask_date, ask_travelers, show_options, confirm_booking, confirm_change, complete",
  "detected_language": "en or es"
}}"""

# Trip summary prompt template
TRIP_SUMMARY_PROMPT = """Generate a friendly, easy-to-read trip summary for an elderly passenger.

RESERVATION DETAILS:
{reservation_json}

LANGUAGE: {language}

Generate a summary that includes:
- Flight route with city names (not just airport codes)
- Date and time in friendly format
- Seat assignment if available
- Confirmation code (spelled out for clarity)
- A warm closing message

For English, use format like:
"Here's your trip summary! ✈️ You're flying from Dallas to Chicago on Saturday, January 26th at 2:00 PM. Your seat is 14A, a window seat. Your confirmation code is D-E-M-O-1-2-3. Have a wonderful trip!"

For Spanish, use format like:
"¡Aquí está el resumen de su viaje! ✈️ Usted vuela de Dallas a Chicago el sábado 26 de enero a las 2:00 PM. Su asiento es el 14A, junto a la ventana. Su código de confirmación es D-E-M-O-1-2-3. ¡Que tenga un excelente viaje!"

Respond with JSON:
{{
  "summary": "The trip summary text",
  "summary_short": "A 1-sentence version for quick reference"
}}"""

# Flight change summary prompt
CHANGE_SUMMARY_PROMPT = """Generate a friendly summary of a flight change for an elderly passenger.

ORIGINAL FLIGHT:
{original_json}

NEW FLIGHT:
{new_json}

LANGUAGE: {language}

Highlight what changed in a clear, reassuring way.

For English:
"Great news! Your flight has been changed. You were on the Friday 2pm flight, and now you're on the Saturday 2pm flight instead. Same great seat, 14A. Your confirmation code stays the same: D-E-M-O-1-2-3."

For Spanish:
"¡Excelentes noticias! Su vuelo ha sido cambiado. Antes tenía el vuelo del viernes a las 2pm, y ahora tiene el del sábado a las 2pm. Mismo asiento, 14A. Su código de confirmación sigue siendo: D-E-M-O-1-2-3."

Respond with JSON:
{{
  "summary": "The change summary text",
  "changes": ["list of what changed"]
}}"""


class GeminiService:
    """Service for Gemini API interactions."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self._model = None

    def _get_model(self):
        """Lazy load the Gemini model."""
        if self._model is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._model = genai.GenerativeModel('gemini-2.0-flash')
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
                self._model = None
        return self._model

    def process_message(
        self,
        user_message: str,
        conversation_history: List[Dict],
        reservation_context: Optional[Dict] = None,
        session_state: str = 'greeting',
        language_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a user message and return AI response.

        Args:
            user_message: The user's spoken message
            conversation_history: List of previous messages
            reservation_context: Current reservation data if available
            session_state: Current conversation state
            language_hint: Hint about user's language preference ('en' or 'es')

        Returns:
            Dict with reply, intent, entities, action, and detected_language
        """
        model = self._get_model()

        # Build context message
        context_parts = [SYSTEM_PROMPT]

        if language_hint:
            context_parts.append(f"\nLANGUAGE HINT: User previously spoke {language_hint}")

        if reservation_context:
            context_parts.append(f"\nCURRENT RESERVATION:\n{json.dumps(reservation_context, indent=2)}")

        context_parts.append(f"\nCURRENT STATE: {session_state}")

        if conversation_history:
            history_text = "\nCONVERSATION HISTORY:\n"
            for msg in conversation_history[-6:]:  # Last 6 messages for context
                role = "User" if msg.get('role') == 'user' else "Assistant"
                history_text += f"{role}: {msg.get('content', '')}\n"
            context_parts.append(history_text)

        context_parts.append(f"\nUSER JUST SAID: \"{user_message}\"")
        context_parts.append("\nRespond with JSON only:")

        full_prompt = "\n".join(context_parts)

        # If no API key or model fails, use fallback
        if not self.api_key or not model:
            return self._fallback_response(user_message, session_state)

        try:
            response = model.generate_content(full_prompt)
            response_text = response.text.strip()

            # Clean up response (remove markdown code blocks if present)
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1])

            result = json.loads(response_text)
            return {
                'reply': result.get('reply', "I'm sorry, I didn't understand that."),
                'intent': result.get('intent', 'unclear'),
                'entities': result.get('entities', {}),
                'action': result.get('action', 'none'),
                'detected_language': result.get('detected_language', 'en'),
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            return self._fallback_response(user_message, session_state)
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._fallback_response(user_message, session_state)

    def generate_trip_summary(
        self,
        reservation_data: Dict[str, Any],
        language: str = 'en'
    ) -> Dict[str, str]:
        """
        Generate a friendly trip summary using Gemini.

        Args:
            reservation_data: The reservation details
            language: 'en' for English, 'es' for Spanish

        Returns:
            Dict with 'summary' and 'summary_short'
        """
        model = self._get_model()

        if not self.api_key or not model:
            return self._fallback_trip_summary(reservation_data, language)

        prompt = TRIP_SUMMARY_PROMPT.format(
            reservation_json=json.dumps(reservation_data, indent=2),
            language='Spanish' if language == 'es' else 'English'
        )

        try:
            response = model.generate_content(prompt)
            response_text = response.text.strip()

            # Clean up response
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1])

            result = json.loads(response_text)
            return {
                'summary': result.get('summary', ''),
                'summary_short': result.get('summary_short', ''),
            }

        except Exception as e:
            logger.error(f"Failed to generate trip summary: {e}")
            return self._fallback_trip_summary(reservation_data, language)

    def generate_change_summary(
        self,
        original_flight: Dict[str, Any],
        new_flight: Dict[str, Any],
        language: str = 'en'
    ) -> Dict[str, Any]:
        """
        Generate a summary of flight changes using Gemini.

        Args:
            original_flight: Original flight details
            new_flight: New flight details
            language: 'en' for English, 'es' for Spanish

        Returns:
            Dict with 'summary' and 'changes' list
        """
        model = self._get_model()

        if not self.api_key or not model:
            return self._fallback_change_summary(original_flight, new_flight, language)

        prompt = CHANGE_SUMMARY_PROMPT.format(
            original_json=json.dumps(original_flight, indent=2),
            new_json=json.dumps(new_flight, indent=2),
            language='Spanish' if language == 'es' else 'English'
        )

        try:
            response = model.generate_content(prompt)
            response_text = response.text.strip()

            # Clean up response
            if response_text.startswith('```'):
                lines = response_text.split('\n')
                response_text = '\n'.join(lines[1:-1])

            result = json.loads(response_text)
            return {
                'summary': result.get('summary', ''),
                'changes': result.get('changes', []),
            }

        except Exception as e:
            logger.error(f"Failed to generate change summary: {e}")
            return self._fallback_change_summary(original_flight, new_flight, language)

    def _fallback_trip_summary(self, reservation_data: Dict, language: str) -> Dict[str, str]:
        """Fallback trip summary when Gemini is unavailable."""
        # Extract basic info
        conf_code = reservation_data.get('confirmation_code', 'N/A')
        passenger = reservation_data.get('passenger', {})
        name = f"{passenger.get('first_name', '')} {passenger.get('last_name', '')}".strip() or 'Passenger'
        flights = reservation_data.get('flights', [])

        if flights:
            flight = flights[0]
            origin = flight.get('origin', 'N/A')
            dest = flight.get('destination', 'N/A')
            seat = flight.get('seat', 'Not assigned')
        else:
            origin = dest = seat = 'N/A'

        if language == 'es':
            summary = f"¡Reservación confirmada! Vuelo de {origin} a {dest}. Asiento: {seat}. Código: {conf_code}."
            short = f"Vuelo {origin} → {dest}, Código: {conf_code}"
        else:
            summary = f"Booking confirmed! Flight from {origin} to {dest}. Seat: {seat}. Confirmation: {conf_code}."
            short = f"Flight {origin} → {dest}, Code: {conf_code}"

        return {'summary': summary, 'summary_short': short}

    def _fallback_change_summary(self, original: Dict, new: Dict, language: str) -> Dict[str, Any]:
        """Fallback change summary when Gemini is unavailable."""
        changes = []

        if original.get('departure_time') != new.get('departure_time'):
            changes.append('departure time' if language == 'en' else 'hora de salida')

        if original.get('date') != new.get('date'):
            changes.append('date' if language == 'en' else 'fecha')

        if language == 'es':
            summary = f"Su vuelo ha sido cambiado. Cambios: {', '.join(changes) or 'ninguno'}."
        else:
            summary = f"Your flight has been changed. Changes: {', '.join(changes) or 'none'}."

        return {'summary': summary, 'changes': changes}

    def _fallback_response(self, user_message: str, session_state: str) -> Dict[str, Any]:
        """Provide fallback response when Gemini is unavailable."""
        user_lower = user_message.lower()

        # Detect Spanish
        spanish_words = ['hola', 'vuelo', 'cambiar', 'reserva', 'ayuda', 'gracias', 'necesito', 'quiero']
        is_spanish = any(word in user_lower for word in spanish_words)
        lang = 'es' if is_spanish else 'en'

        # Simple intent detection with bilingual responses
        if any(word in user_lower for word in ['change', 'reschedule', 'different', 'move', 'cambiar', 'mover']):
            reply = "Me encantaría ayudarle a cambiar su vuelo. ¿Cuál es su código de confirmación?" if is_spanish else "I'd be happy to help you change your flight. What's your confirmation code?"
            return {
                'reply': reply,
                'intent': 'change_flight',
                'entities': {},
                'action': 'none',
                'detected_language': lang,
            }
        elif any(word in user_lower for word in ['status', 'where', 'when', 'time', 'estado', 'dónde', 'cuándo']):
            reply = "Puedo verificar el estado de su vuelo. ¿Cuál es su código de confirmación?" if is_spanish else "I can check your flight status. What's your confirmation code?"
            return {
                'reply': reply,
                'intent': 'check_status',
                'entities': {},
                'action': 'none',
                'detected_language': lang,
            }
        elif any(word in user_lower for word in ['yes', 'correct', 'right', 'confirm', 'book', 'sí', 'correcto', 'confirmar']):
            reply = "¡Perfecto! Permítame confirmar ese cambio." if is_spanish else "Great! Let me confirm that change for you."
            return {
                'reply': reply,
                'intent': 'confirm_action',
                'entities': {},
                'action': 'confirm_change',
                'detected_language': lang,
            }
        elif any(word in user_lower for word in ['no', 'cancel', 'never mind', 'stop', 'cancelar', 'no importa']):
            reply = "No hay problema. ¿Hay algo más en que pueda ayudarle?" if is_spanish else "No problem. Is there something else I can help you with?"
            return {
                'reply': reply,
                'intent': 'cancel_action',
                'entities': {},
                'action': 'none',
                'detected_language': lang,
            }
        elif any(word in user_lower for word in ['help', 'family', 'daughter', 'son', 'ayuda', 'familia', 'hija', 'hijo']):
            reply = "Puedo crear un enlace para compartir con su familia para que puedan ayudarle. ¿Le gustaría que lo haga?" if is_spanish else "I can create a link to share with your family so they can help. Would you like me to do that?"
            return {
                'reply': reply,
                'intent': 'family_help',
                'entities': {},
                'action': 'none',
                'detected_language': lang,
            }
        elif session_state == 'greeting':
            reply = "¡Con mucho gusto le ayudo! ¿Necesita cambiar un vuelo o verificar el estado de un vuelo?" if is_spanish else "I'd be happy to help! Do you need to change a flight, or check on a flight status?"
            return {
                'reply': reply,
                'intent': 'greeting',
                'entities': {},
                'action': 'none',
                'detected_language': lang,
            }
        else:
            reply = "Lo siento, no entendí bien. ¿Podría repetirlo?" if is_spanish else "I'm sorry, I didn't quite catch that. Could you please say that again?"
            return {
                'reply': reply,
                'intent': 'unclear',
                'entities': {},
                'action': 'none',
                'detected_language': lang,
            }

    def extract_confirmation_code(self, text: str) -> Optional[str]:
        """Extract confirmation code from text, handling spelled-out letters."""
        import re

        # Direct 6-7 character code (AA uses both formats)
        match = re.search(r'\b([A-Z0-9]{6,7})\b', text.upper())
        if match:
            return match.group(1)

        # Handle spelled out letters like "D E M O 1 2 3" or "D-E-M-O-1-2-3"
        spelled = re.sub(r'[\s\-]+', '', text.upper())
        if 6 <= len(spelled) <= 7 and spelled.isalnum():
            return spelled

        # Handle phonetic alphabet ("Delta Echo Mike Oscar One Two Three")
        phonetic = {
            'ALPHA': 'A', 'BRAVO': 'B', 'CHARLIE': 'C', 'DELTA': 'D',
            'ECHO': 'E', 'FOXTROT': 'F', 'GOLF': 'G', 'HOTEL': 'H',
            'INDIA': 'I', 'JULIET': 'J', 'KILO': 'K', 'LIMA': 'L',
            'MIKE': 'M', 'NOVEMBER': 'N', 'OSCAR': 'O', 'PAPA': 'P',
            'QUEBEC': 'Q', 'ROMEO': 'R', 'SIERRA': 'S', 'TANGO': 'T',
            'UNIFORM': 'U', 'VICTOR': 'V', 'WHISKEY': 'W', 'XRAY': 'X',
            'YANKEE': 'Y', 'ZULU': 'Z',
            'ONE': '1', 'TWO': '2', 'THREE': '3', 'FOUR': '4', 'FIVE': '5',
            'SIX': '6', 'SEVEN': '7', 'EIGHT': '8', 'NINE': '9', 'ZERO': '0',
        }

        words = text.upper().split()
        code = ''
        for word in words:
            if word in phonetic:
                code += phonetic[word]
            elif len(word) == 1 and word.isalnum():
                code += word

        if 6 <= len(code) <= 7:
            return code

        return None
