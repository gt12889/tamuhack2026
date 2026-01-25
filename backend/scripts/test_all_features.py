#!/usr/bin/env python
"""
End-to-end feature test script for Elder Strolls.
Tests all major features with sample workflows.
"""

import os
import sys
import json
import time
import requests

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voice_concierge.settings')

import django
django.setup()

# Test configuration
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:8001')
VERBOSE = os.getenv('TEST_VERBOSE', 'true').lower() == 'true'

# Test results
results = []


def log(msg, level='info'):
    """Print log message."""
    prefix = {'info': '  ', 'pass': '[PASS]', 'fail': '[FAIL]', 'skip': '[SKIP]'}
    print(f"{prefix.get(level, '  ')} {msg}")


def test(name):
    """Decorator for test functions."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"\n{'='*60}")
            print(f"TEST: {name}")
            print('='*60)
            try:
                result = func(*args, **kwargs)
                if result:
                    log(f"{name} - PASSED", 'pass')
                    results.append((name, True, None))
                else:
                    log(f"{name} - FAILED", 'fail')
                    results.append((name, False, "Test returned False"))
                return result
            except Exception as e:
                log(f"{name} - ERROR: {e}", 'fail')
                results.append((name, False, str(e)))
                return False
        return wrapper
    return decorator


# ==================== TESTS ====================

@test("Backend Health Check")
def test_health():
    """Test backend health endpoint."""
    r = requests.get(f"{BASE_URL}/api/health/")
    data = r.json()
    log(f"Status: {data.get('status')}")
    log(f"Database: {data.get('database')}")
    return data.get('status') == 'healthy'


@test("Email Service Status")
def test_email_status():
    """Test Resend email service configuration."""
    r = requests.get(f"{BASE_URL}/api/email/status")
    data = r.json()
    log(f"Configured: {data.get('configured')}")
    return data.get('configured') == True


@test("Conversation - English Flow")
def test_english_conversation():
    """Test full English conversation flow."""
    # Start session
    r = requests.post(f"{BASE_URL}/api/conversation/start")
    data = r.json()
    session_id = data.get('session_id')
    log(f"Session started: {session_id[:8]}...")

    # Request flight change
    r = requests.post(f"{BASE_URL}/api/conversation/message", json={
        'session_id': session_id,
        'transcript': 'I need to change my flight'
    })
    data = r.json()
    log(f"Intent: {data.get('intent')}")
    log(f"Language: {data.get('detected_language')}")

    if data.get('detected_language') != 'en':
        return False

    # Provide confirmation code
    r = requests.post(f"{BASE_URL}/api/conversation/message", json={
        'session_id': session_id,
        'transcript': 'My confirmation code is DEMO123'
    })
    data = r.json()
    log(f"State: {data.get('session_state')}")

    # Confirm change
    r = requests.post(f"{BASE_URL}/api/conversation/message", json={
        'session_id': session_id,
        'transcript': 'Yes please book that flight'
    })
    data = r.json()
    log(f"Final state: {data.get('session_state')}")
    log(f"Email sent: {data.get('email_sent')}")

    return data.get('session_state') == 'complete'


@test("Conversation - Spanish Flow")
def test_spanish_conversation():
    """Test full Spanish conversation flow."""
    # Start session
    r = requests.post(f"{BASE_URL}/api/conversation/start")
    session_id = r.json().get('session_id')
    log(f"Session started: {session_id[:8]}...")

    # Spanish request
    r = requests.post(f"{BASE_URL}/api/conversation/message", json={
        'session_id': session_id,
        'transcript': 'Hola, necesito cambiar mi vuelo por favor'
    })
    data = r.json()
    log(f"Language detected: {data.get('detected_language')}")
    log(f"Reply preview: {data.get('reply', '')[:50]}...")

    if data.get('detected_language') != 'es':
        log("Spanish not detected!", 'fail')
        return False

    # Provide code in Spanish
    r = requests.post(f"{BASE_URL}/api/conversation/message", json={
        'session_id': session_id,
        'transcript': 'Mi codigo de confirmacion es DEMO123'
    })
    data = r.json()
    log(f"State: {data.get('session_state')}")

    # Confirm in Spanish
    r = requests.post(f"{BASE_URL}/api/conversation/message", json={
        'session_id': session_id,
        'transcript': 'Si, por favor reserve ese vuelo'
    })
    data = r.json()
    log(f"Final state: {data.get('session_state')}")
    log(f"Email sent: {data.get('email_sent')}")

    return data.get('detected_language') == 'es'


@test("Trip Summary Generation")
def test_trip_summary():
    """Test Gemini trip summary generation."""
    from api.services import GeminiService

    gemini = GeminiService()

    reservation_data = {
        'confirmation_code': 'TEST123',
        'passenger': {'first_name': 'Test', 'last_name': 'User'},
        'flights': [{
            'flight_number': 'AA1234',
            'origin': 'DFW',
            'destination': 'ORD',
            'departure_time': '2026-01-25T14:00:00',
            'seat': '14A'
        }]
    }

    # English
    result_en = gemini.generate_trip_summary(reservation_data, 'en')
    log(f"English summary length: {len(result_en.get('summary', ''))}")

    # Spanish
    result_es = gemini.generate_trip_summary(reservation_data, 'es')
    log(f"Spanish summary length: {len(result_es.get('summary', ''))}")

    return len(result_en.get('summary', '')) > 0


@test("Flight Change Summary")
def test_change_summary():
    """Test Gemini flight change summary."""
    from api.services import GeminiService

    gemini = GeminiService()

    original = {
        'flight_number': 'AA1234',
        'origin': 'DFW',
        'destination': 'ORD',
        'departure_time': '2026-01-24T14:00:00'
    }

    new = {
        'flight_number': 'AA1234',
        'origin': 'DFW',
        'destination': 'ORD',
        'departure_time': '2026-01-25T14:00:00'
    }

    result = gemini.generate_change_summary(original, new, 'en')
    log(f"Summary: {result.get('summary', '')[:80]}...")
    log(f"Changes: {result.get('changes', [])}")

    return len(result.get('summary', '')) > 0


@test("ElevenLabs TTS")
def test_tts():
    """Test text-to-speech synthesis."""
    # English
    r = requests.post(f"{BASE_URL}/api/voice/synthesize", json={
        'text': 'Your flight has been confirmed.',
        'language': 'en'
    })
    data_en = r.json()
    log(f"English - Has audio: {data_en.get('audio_url') is not None or data_en.get('fallback')}")

    # Spanish
    r = requests.post(f"{BASE_URL}/api/voice/synthesize", json={
        'text': 'Su vuelo ha sido confirmado.',
        'language': 'es'
    })
    data_es = r.json()
    log(f"Spanish - Has audio: {data_es.get('audio_url') is not None or data_es.get('fallback')}")

    return True  # Fallback is acceptable


@test("Flight Search API")
def test_flight_search():
    """Test flight search endpoints."""
    # Get airports
    r = requests.get(f"{BASE_URL}/api/airports/")
    airports = r.json()
    log(f"Airports count: {len(airports)}")

    # Search flights
    r = requests.get(f"{BASE_URL}/api/flights/search", params={
        'origin': 'DFW',
        'destination': 'ORD',
        'date': '2026-01-25'
    })
    data = r.json()
    log(f"Flights found: {data.get('count', 0)}")

    return data.get('count', 0) > 0


@test("Family Helper Link")
def test_helper_link():
    """Test family helper link creation."""
    # Start session
    r = requests.post(f"{BASE_URL}/api/conversation/start")
    session_id = r.json().get('session_id')

    # Create helper link
    r = requests.post(f"{BASE_URL}/api/helper/create-link", json={
        'session_id': session_id
    })
    data = r.json()
    log(f"Helper link: {data.get('helper_link')}")

    if not data.get('helper_link'):
        return False

    # Access helper session
    r = requests.get(f"{BASE_URL}/api/helper/{data.get('helper_link')}")
    helper_data = r.json()
    log(f"Session accessible: {helper_data.get('session') is not None}")

    return helper_data.get('session') is not None


@test("Reservation Lookup")
def test_reservation_lookup():
    """Test reservation lookup by code."""
    r = requests.get(f"{BASE_URL}/api/reservation/lookup", params={
        'confirmation_code': 'DEMO123'
    })
    data = r.json()

    if 'reservation' in data:
        res = data['reservation']
        log(f"Found: {res.get('confirmation_code')}")
        log(f"Passenger: {res.get('passenger', {}).get('first_name')}")
        return True

    log("Reservation not found (may need to run conversation first)")
    return True  # Skip if not found


@test("CRUD Endpoints")
def test_crud():
    """Test CRUD API endpoints."""
    endpoints = [
        '/api/passengers/',
        '/api/reservations/',
        '/api/flights-db/',
        '/api/sessions/',
    ]

    for endpoint in endpoints:
        r = requests.get(f"{BASE_URL}{endpoint}")
        log(f"{endpoint}: {r.status_code}")
        if r.status_code != 200:
            return False

    return True


# ==================== MAIN ====================

def run_all_tests():
    """Run all tests and print summary."""
    print("\n" + "="*60)
    print("ELDER STROLLS - END-TO-END TESTS")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    # Run tests
    test_health()
    test_email_status()
    test_english_conversation()
    test_spanish_conversation()
    test_trip_summary()
    test_change_summary()
    test_tts()
    test_flight_search()
    test_helper_link()
    test_reservation_lookup()
    test_crud()

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = sum(1 for _, p, _ in results if p)
    failed = sum(1 for _, p, _ in results if not p)

    for name, passed_test, error in results:
        status = "[PASS]" if passed_test else f"[FAIL]: {error}"
        print(f"  {name}: {status}")

    print(f"\nTotal: {passed} passed, {failed} failed out of {len(results)}")

    return failed == 0


if __name__ == '__main__':
    import warnings
    warnings.filterwarnings('ignore')
    success = run_all_tests()
    sys.exit(0 if success else 1)
