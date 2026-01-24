"""Gemini AI service for conversation understanding."""

import json
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings

logger = logging.getLogger(__name__)

# System prompt for elderly-friendly conversation
SYSTEM_PROMPT = """You are a friendly American Airlines voice assistant helping elderly passengers manage their flights. Your name is "AA Assistant."

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
7. Spell out months (January, not 1/25)
8. Be patient if they spell things out letter by letter

IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, just pure JSON.

Response format:
{
  "reply": "Your conversational response to speak to the user",
  "intent": "one of: greeting, lookup_reservation, change_flight, check_status, confirm_action, cancel_action, need_help, family_help, unclear",
  "entities": {
    "confirmation_code": "extracted code if any",
    "date": "extracted date if any",
    "city": "extracted city if any",
    "flight_number": "extracted flight number if any"
  },
  "action": "one of: none, lookup, show_options, confirm_change, complete, null"
}"""


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
                self._model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
                self._model = None
        return self._model

    def process_message(
        self,
        user_message: str,
        conversation_history: List[Dict],
        reservation_context: Optional[Dict] = None,
        session_state: str = 'greeting'
    ) -> Dict[str, Any]:
        """
        Process a user message and return AI response.

        Args:
            user_message: The user's spoken message
            conversation_history: List of previous messages
            reservation_context: Current reservation data if available
            session_state: Current conversation state

        Returns:
            Dict with reply, intent, entities, and action
        """
        model = self._get_model()

        # Build context message
        context_parts = [SYSTEM_PROMPT]

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
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            return self._fallback_response(user_message, session_state)
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._fallback_response(user_message, session_state)

    def _fallback_response(self, user_message: str, session_state: str) -> Dict[str, Any]:
        """Provide fallback response when Gemini is unavailable."""
        user_lower = user_message.lower()

        # Simple intent detection
        if any(word in user_lower for word in ['change', 'reschedule', 'different', 'move']):
            return {
                'reply': "I'd be happy to help you change your flight. What's your confirmation code?",
                'intent': 'change_flight',
                'entities': {},
                'action': 'none',
            }
        elif any(word in user_lower for word in ['status', 'where', 'when', 'time']):
            return {
                'reply': "I can check your flight status. What's your confirmation code?",
                'intent': 'check_status',
                'entities': {},
                'action': 'none',
            }
        elif any(word in user_lower for word in ['yes', 'correct', 'right', 'confirm', 'book']):
            return {
                'reply': "Great! Let me confirm that change for you.",
                'intent': 'confirm_action',
                'entities': {},
                'action': 'confirm_change',
            }
        elif any(word in user_lower for word in ['no', 'cancel', 'never mind', 'stop']):
            return {
                'reply': "No problem. Is there something else I can help you with?",
                'intent': 'cancel_action',
                'entities': {},
                'action': 'none',
            }
        elif any(word in user_lower for word in ['help', 'family', 'daughter', 'son', 'relative']):
            return {
                'reply': "I can create a link to share with your family so they can help. Would you like me to do that?",
                'intent': 'family_help',
                'entities': {},
                'action': 'none',
            }
        elif session_state == 'greeting':
            return {
                'reply': "I'd be happy to help! Do you need to change a flight, or check on a flight status?",
                'intent': 'greeting',
                'entities': {},
                'action': 'none',
            }
        else:
            return {
                'reply': "I'm sorry, I didn't quite catch that. Could you please say that again?",
                'intent': 'unclear',
                'entities': {},
                'action': 'none',
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
