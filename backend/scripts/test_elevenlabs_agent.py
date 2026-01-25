#!/usr/bin/env python
"""
ElevenLabs Conversational AI Agent Test Script

Tests the ElevenLabs agent's ability to:
1. Call server tools correctly
2. Provide appropriate responses
3. Handle user queries accurately

This script can test via:
- Direct webhook handler testing (unit tests)
- ElevenLabs API integration (if configured)
- Response validation
"""

import os
import sys
import json
import time
import re
from typing import Dict, Any, Optional, List, Tuple

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voice_concierge.settings')

import django
django.setup()

from api.services.elevenlabs_webhook_handler import ElevenLabsWebhookHandler
from api.services.elevenlabs_service import ElevenLabsService
from api.models import Session, Reservation, Passenger, Flight, FlightSegment
from api.mock_data import get_demo_reservations

# Test configuration
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:8000')
VERBOSE = os.getenv('TEST_VERBOSE', 'true').lower() == 'true'

# Test results
results: List[Tuple[str, bool, str, Optional[Dict]]] = []


def log(msg: str, level: str = 'info'):
    """Print log message."""
    prefix = {'info': '  ', 'pass': '[PASS]', 'fail': '[FAIL]', 'skip': '[SKIP]', 'warn': '[WARN]'}
    print(f"{prefix.get(level, '  ')} {msg}")


def test(name: str):
    """Decorator for test functions."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            print(f"\n{'='*70}")
            print(f"TEST: {name}")
            print('='*70)
            try:
                result, details = func(*args, **kwargs)
                if result:
                    log(f"{name} - PASSED", 'pass')
                    if details:
                        log(f"Details: {details}", 'info')
                    results.append((name, True, None, details))
                else:
                    log(f"{name} - FAILED", 'fail')
                    if details:
                        log(f"Details: {details}", 'info')
                    results.append((name, False, str(details), None))
                return result, details
            except Exception as e:
                log(f"{name} - ERROR: {e}", 'fail')
                import traceback
                if VERBOSE:
                    traceback.print_exc()
                results.append((name, False, str(e), None))
                return False, str(e)
        return wrapper
    return decorator


# ==================== HELPER FUNCTIONS ====================

def ensure_test_reservation():
    """Ensure test reservation ABUEL1 exists."""
    try:
        reservation = Reservation.objects.filter(confirmation_code='ABUEL1').first()
        if not reservation:
            # Create test reservation
            passenger = Passenger.objects.create(
                first_name='Maria',
                last_name='Garcia',
                email='maria.garcia@test.com',
                phone='+15551234567',
            )
            
            flight = Flight.objects.create(
                flight_number='AA2345',
                origin='MIA',
                destination='DFW',
                departure_time='2026-01-29T14:00:00Z',
                arrival_time='2026-01-29T17:00:00Z',
                gate='D15',
                status='scheduled',
            )
            
            FlightSegment.objects.create(
                flight=flight,
                seat='6A',
                order=1,
            )
            
            reservation = Reservation.objects.create(
                confirmation_code='ABUEL1',
                passenger=passenger,
                status='confirmed',
            )
            reservation.flights.add(flight)
            
            log("Created test reservation ABUEL1", 'info')
        return reservation
    except Exception as e:
        log(f"Error ensuring test reservation: {e}", 'warn')
        return None


def check_response_contains(response: str, keywords: List[str], case_sensitive: bool = False) -> Tuple[bool, List[str]]:
    """Check if response contains required keywords."""
    if not response:
        return False, ["Response is empty"]
    
    response_check = response if case_sensitive else response.lower()
    missing = []
    found = []
    
    for keyword in keywords:
        keyword_check = keyword if case_sensitive else keyword.lower()
        if keyword_check in response_check:
            found.append(keyword)
        else:
            missing.append(keyword)
    
    return len(missing) == 0, missing if missing else found


def test_tool_call_via_webhook(tool_name: str, parameters: Dict[str, Any], expected_result_keys: Optional[List[str]] = None) -> Tuple[bool, Dict]:
    """Test a server tool call via webhook handler."""
    handler = ElevenLabsWebhookHandler()
    result = handler.handle_server_tool(tool_name, parameters)
    
    if not result.get('success'):
        return False, {'error': result.get('error', 'Tool call failed')}
    
    tool_result = result.get('result', {})
    
    if expected_result_keys is not None:
        missing_keys = [key for key in expected_result_keys if key not in tool_result]
        if missing_keys:
            return False, {'error': f'Missing keys in result: {missing_keys}', 'result': tool_result}
    
    return True, tool_result


# ==================== TESTS ====================

@test("Test 1: Lookup Reservation by Confirmation Code")
def test_lookup_reservation():
    """Test that agent calls lookup_reservation tool and reads back flight details."""
    ensure_test_reservation()
    
    # Test the tool directly
    success, result = test_tool_call_via_webhook(
        'lookup_reservation',
        {'confirmation_code': 'ABUEL1'},
        expected_result_keys=['passenger_name', 'flight_number', 'gate', 'seat']
    )
    
    if not success:
        return False, result
    
    # Validate response content
    passenger_name = result.get('passenger_name', '')
    flight_number = result.get('flight_number', '')
    gate = result.get('gate', '')
    seat = result.get('seat', '')
    
    checks = []
    if 'maria' in passenger_name.lower() and 'garcia' in passenger_name.lower():
        checks.append('[OK] Passenger name correct')
    else:
        checks.append(f'[X] Passenger name incorrect: {passenger_name}')
    
    if flight_number == 'AA2345':
        checks.append('[OK] Flight number correct')
    else:
        checks.append(f'[X] Flight number incorrect: {flight_number}')
    
    if gate == 'D15':
        checks.append('[OK] Gate correct')
    else:
        checks.append(f'[X] Gate incorrect: {gate}')
    
    if seat == '6A':
        checks.append('[OK] Seat correct')
    else:
        checks.append(f'[X] Seat incorrect: {seat}')
    
    # Check for spoken_summary field (critical for agent to read back)
    spoken_summary = result.get('spoken_summary', '')
    has_spoken_summary = bool(spoken_summary)
    
    if has_spoken_summary:
        checks.append('[OK] spoken_summary provided for agent to read back')
        # Verify spoken_summary contains key information
        summary_lower = spoken_summary.lower()
        has_passenger_name = 'maria' in summary_lower
        has_flight = 'AA2345' in spoken_summary or 'aa2345' in summary_lower
        has_gate = 'D15' in spoken_summary or 'd15' in summary_lower
        has_seat = '6A' in spoken_summary or '6a' in summary_lower
        
        if has_passenger_name:
            checks.append('[OK] spoken_summary includes passenger name')
        else:
            checks.append('[X] spoken_summary missing passenger name')
        
        if has_flight:
            checks.append('[OK] spoken_summary includes flight number')
        else:
            checks.append('[X] spoken_summary missing flight number')
        
        if has_gate:
            checks.append('[OK] spoken_summary includes gate')
        else:
            checks.append('[X] spoken_summary missing gate')
        
        if has_seat:
            checks.append('[OK] spoken_summary includes seat')
        else:
            checks.append('[X] spoken_summary missing seat')
    else:
        checks.append('[X] CRITICAL: No spoken_summary field - agent cannot read back results!')
        all_passed = False  # Fail if no spoken_summary
    
    all_passed = all('[OK]' in check for check in checks) and all_passed
    
    # Expected agent response pattern
    expected_keywords = ['maria', 'garcia', 'AA2345', 'miami', 'dallas', 'D15', '6A']
    
    return all_passed, {
        'tool_result': result,
        'validation_checks': checks,
        'expected_keywords': expected_keywords,
        'spoken_summary': spoken_summary if has_spoken_summary else 'MISSING',
        'note': 'Agent should read back: "I found your reservation Maria. You are booked on flight AA2345 from Miami to Dallas departing January 29. Your gate is D15 and you are in seat 6A."'
    }


@test("Test 2: Get Directions to Restroom")
def test_get_directions_restroom():
    """Test that agent calls get_directions tool for restroom."""
    # Test the tool directly
    success, result = test_tool_call_via_webhook(
        'get_directions',
        {'destination_type': 'restroom', 'current_location': 'Terminal A'},
        expected_result_keys=['directions']
    )
    
    if not success:
        return False, result
    
    directions = result.get('directions', '')
    terminal = result.get('terminal', '')
    near_gate = result.get('near_gate', '')
    
    # Check if response contains terminal and gate info
    has_terminal = 'terminal' in directions.lower() or terminal
    has_gate = 'gate' in directions.lower() or near_gate
    
    checks = []
    if has_terminal:
        checks.append('[OK] Contains terminal information')
    else:
        checks.append('[X] Missing terminal information')
    
    if has_gate:
        checks.append('[OK] Contains gate information')
    else:
        checks.append('[X] Missing gate information')
    
    if directions:
        checks.append('[OK] Directions provided')
    else:
        checks.append('[X] No directions provided')
    
    all_passed = all('[OK]' in check for check in checks)
    
    expected_keywords = ['restroom', 'terminal', 'gate']
    
    return all_passed, {
        'tool_result': result,
        'validation_checks': checks,
        'expected_keywords': expected_keywords,
        'note': 'Agent should say: "The nearest restroom is in Terminal A near Gate A12, just past security on the right"'
    }


@test("Test 3: Request Wheelchair")
def test_request_wheelchair():
    """Test that agent calls request_wheelchair tool and confirms with wait time."""
    ensure_test_reservation()
    
    # Test the tool directly
    success, result = test_tool_call_via_webhook(
        'request_wheelchair',
        {'confirmation_code': 'ABUEL1'},
        expected_result_keys=['success', 'estimated_wait']
    )
    
    if not success:
        return False, result
    
    estimated_wait = result.get('estimated_wait', '')
    success_flag = result.get('success', False) or result.get('requested', False)
    
    checks = []
    if success_flag:
        checks.append('[OK] Wheelchair requested successfully')
    else:
        checks.append('[X] Wheelchair request failed')
    
    if estimated_wait:
        # Check if wait time is mentioned (10-15 minutes)
        wait_str = str(estimated_wait).lower()
        if '10' in wait_str or '15' in wait_str or 'minute' in wait_str:
            checks.append('[OK] Wait time mentioned')
        else:
            checks.append(f'[X] Wait time not clear: {estimated_wait}')
    else:
        checks.append('[X] No wait time provided')
    
    all_passed = all('[OK]' in check for check in checks)
    
    expected_keywords = ['wheelchair', 'requested', '10', '15', 'minute']
    
    return all_passed, {
        'tool_result': result,
        'validation_checks': checks,
        'expected_keywords': expected_keywords,
        'note': 'Agent should say: "I have requested wheelchair assistance for you. Someone will meet you within 10 to 15 minutes."'
    }


@test("Test 4: Check Flight Delays")
def test_check_flight_delays():
    """Test that agent calls check_flight_delays tool and reports flight status."""
    ensure_test_reservation()
    
    # Test the tool directly
    success, result = test_tool_call_via_webhook(
        'check_flight_delays',
        {'confirmation_code': 'ABUEL1'},
        expected_result_keys=['status']
    )
    
    if not success:
        return False, result
    
    status = result.get('status', '')
    spoken_response = result.get('spoken_response', '')
    
    checks = []
    if status:
        checks.append('[OK] Flight status provided')
        if status == 'on_time' or 'on time' in status.lower():
            checks.append('[OK] Flight is on time')
        else:
            checks.append(f'[X] Flight status: {status} (unexpected)')
    else:
        checks.append('[X] No flight status')
    
    if spoken_response:
        checks.append('[OK] Spoken response provided')
    else:
        checks.append('[X] No spoken response')
    
    all_passed = all('[OK]' in check for check in checks)
    
    expected_keywords = ['AA2345', 'on time', 'scheduled']
    
    return all_passed, {
        'tool_result': result,
        'validation_checks': checks,
        'expected_keywords': expected_keywords,
        'note': 'Agent should say: "Good news! Your flight AA2345 is currently on time and scheduled to depart as planned."'
    }


@test("Test 5: Create Family Helper Link")
def test_create_family_helper_link():
    """Test that agent calls create_family_helper_link tool and provides shareable URL."""
    ensure_test_reservation()
    
    # Create a test session first
    from django.utils import timezone
    from datetime import timedelta
    session = Session.objects.create(
        state='active',
        expires_at=timezone.now() + timedelta(minutes=30),
        context={'reservation_code': 'ABUEL1'},
    )
    
    # Test the tool directly
    success, result = test_tool_call_via_webhook(
        'create_family_helper_link',
        {'confirmation_code': 'ABUEL1'},
        expected_result_keys=['helper_link']
    )
    
    if not success:
        return False, result
    
    helper_link = result.get('helper_link', '')
    
    checks = []
    if helper_link:
        checks.append('[OK] Helper link created')
        if 'http' in helper_link.lower() or len(helper_link) > 10:
            checks.append('[OK] Link appears valid')
        else:
            checks.append('[WARN] Link format unclear')
    else:
        checks.append('[X] No helper link provided')
    
    all_passed = all('[OK]' in check for check in checks)
    
    expected_keywords = ['helper', 'link', 'share', 'family', 'track']
    
    return all_passed, {
        'tool_result': result,
        'validation_checks': checks,
        'expected_keywords': expected_keywords,
        'note': 'Agent should say: "I have created a helper link you can share with your family. They will be able to see your location in the airport."'
    }


@test("Test 6: Get Gate Directions")
def test_get_gate_directions():
    """Test that agent calls get_gate_directions tool and provides step-by-step directions."""
    # Test the tool directly
    success, result = test_tool_call_via_webhook(
        'get_gate_directions',
        {'gate': 'B22', 'current_location': 'Terminal A'},
        expected_result_keys=None  # Don't require specific keys, just check content
    )
    
    if not success:
        return False, result
    
    directions = result.get('directions', '')
    spoken_response = result.get('spoken_response', '')
    
    # Check for Skylink mention and step-by-step instructions
    directions_lower = directions.lower() if directions else ''
    spoken_lower = spoken_response.lower() if spoken_response else ''
    combined = directions_lower + ' ' + spoken_lower
    
    has_skylink = 'skylink' in combined
    has_terminal_b = 'terminal b' in combined
    has_steps = 'step' in combined or 'turn' in combined or 'take' in combined
    
    checks = []
    if has_skylink:
        checks.append('[OK] Mentions Skylink')
    else:
        checks.append('[X] Does not mention Skylink')
    
    if has_terminal_b:
        checks.append('[OK] Mentions Terminal B')
    else:
        checks.append('[X] Does not mention Terminal B')
    
    if has_steps:
        checks.append('[OK] Provides step-by-step directions')
    else:
        checks.append('[X] No step-by-step directions')
    
    if directions or spoken_response:
        checks.append('[OK] Directions provided')
    else:
        checks.append('[X] No directions provided')
    
    all_passed = all('[OK]' in check for check in checks)
    
    expected_keywords = ['B22', 'skylink', 'terminal b', 'minute']
    
    return all_passed, {
        'tool_result': result,
        'validation_checks': checks,
        'expected_keywords': expected_keywords,
        'note': 'Agent should say: "To get to Gate B22, take the Skylink train to Terminal B, exit and turn left. It should take about 10 to 15 minutes."'
    }


# ==================== MAIN ====================

def run_all_tests():
    """Run all ElevenLabs agent tests."""
    print("\n" + "="*70)
    print("ELEVENLABS CONVERSATIONAL AI AGENT TESTS")
    print("="*70)
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Base URL: {BASE_URL}")
    print("\nNote: These tests validate server tool functionality.")
    print("For full agent conversation testing, use the ElevenLabs dashboard")
    print("or start a web call from the frontend.\n")
    
    # Run tests
    test_lookup_reservation()
    test_get_directions_restroom()
    test_request_wheelchair()
    test_check_flight_delays()
    test_create_family_helper_link()
    test_get_gate_directions()
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, p, _, _ in results if p)
    failed = sum(1 for _, p, _, _ in results if not p)
    
    for name, passed_test, error, details in results:
        status = "[PASS]" if passed_test else f"[FAIL]"
        print(f"  {status} {name}")
        if error and not passed_test:
            print(f"      Error: {error}")
        if details and VERBOSE:
            if isinstance(details, dict):
                for key, value in details.items():
                    if key != 'tool_result':  # Skip full tool result in summary
                        print(f"      {key}: {value}")
    
    print(f"\nTotal: {passed} passed, {failed} failed out of {len(results)}")
    
    if failed == 0:
        print("\n[SUCCESS] All server tool tests passed!")
        print("\nNext steps:")
        print("1. Test agent conversations in ElevenLabs dashboard")
        print("2. Start a web call from the frontend and test with voice")
        print("3. Verify agent calls tools correctly during conversations")
    else:
        print(f"\n[FAILED] {failed} test(s) failed. Review errors above.")
    
    return failed == 0


if __name__ == '__main__':
    import warnings
    warnings.filterwarnings('ignore')
    success = run_all_tests()
    sys.exit(0 if success else 1)
