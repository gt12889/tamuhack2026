"""
Static airport data for gate locations and geofences.
Contains gate coordinates for major airports to enable location tracking.
"""

from typing import Dict, Any, Optional, Tuple

# Gate locations for major airports
# Coordinates are approximate gate/terminal locations
AIRPORT_GATES = {
    'DFW': {
        # Terminal A
        'A1': {'lat': 32.9002, 'lng': -97.0370, 'terminal': 'A'},
        'A2': {'lat': 32.9004, 'lng': -97.0368, 'terminal': 'A'},
        'A3': {'lat': 32.9006, 'lng': -97.0366, 'terminal': 'A'},
        'A10': {'lat': 32.9010, 'lng': -97.0360, 'terminal': 'A'},
        'A15': {'lat': 32.9012, 'lng': -97.0355, 'terminal': 'A'},
        'A20': {'lat': 32.9015, 'lng': -97.0350, 'terminal': 'A'},
        'A25': {'lat': 32.9018, 'lng': -97.0345, 'terminal': 'A'},
        'A30': {'lat': 32.9020, 'lng': -97.0340, 'terminal': 'A'},
        'A35': {'lat': 32.9022, 'lng': -97.0335, 'terminal': 'A'},
        'A38': {'lat': 32.9024, 'lng': -97.0332, 'terminal': 'A'},
        # Terminal B
        'B1': {'lat': 32.8975, 'lng': -97.0382, 'terminal': 'B'},
        'B5': {'lat': 32.8978, 'lng': -97.0380, 'terminal': 'B'},
        'B10': {'lat': 32.8980, 'lng': -97.0375, 'terminal': 'B'},
        'B15': {'lat': 32.8982, 'lng': -97.0370, 'terminal': 'B'},
        'B20': {'lat': 32.8985, 'lng': -97.0365, 'terminal': 'B'},
        'B22': {'lat': 32.8986, 'lng': -97.0363, 'terminal': 'B'},
        'B25': {'lat': 32.8988, 'lng': -97.0360, 'terminal': 'B'},
        'B30': {'lat': 32.8990, 'lng': -97.0355, 'terminal': 'B'},
        'B35': {'lat': 32.8992, 'lng': -97.0350, 'terminal': 'B'},
        'B40': {'lat': 32.8995, 'lng': -97.0345, 'terminal': 'B'},
        'B45': {'lat': 32.8998, 'lng': -97.0340, 'terminal': 'B'},
        # Terminal C
        'C1': {'lat': 32.8950, 'lng': -97.0400, 'terminal': 'C'},
        'C5': {'lat': 32.8952, 'lng': -97.0395, 'terminal': 'C'},
        'C10': {'lat': 32.8955, 'lng': -97.0390, 'terminal': 'C'},
        'C15': {'lat': 32.8958, 'lng': -97.0385, 'terminal': 'C'},
        'C20': {'lat': 32.8960, 'lng': -97.0380, 'terminal': 'C'},
        'C25': {'lat': 32.8962, 'lng': -97.0375, 'terminal': 'C'},
        'C30': {'lat': 32.8965, 'lng': -97.0370, 'terminal': 'C'},
        # Terminal D
        'D1': {'lat': 32.8925, 'lng': -97.0420, 'terminal': 'D'},
        'D5': {'lat': 32.8928, 'lng': -97.0415, 'terminal': 'D'},
        'D10': {'lat': 32.8930, 'lng': -97.0410, 'terminal': 'D'},
        'D15': {'lat': 32.8932, 'lng': -97.0405, 'terminal': 'D'},
        'D20': {'lat': 32.8935, 'lng': -97.0400, 'terminal': 'D'},
        'D25': {'lat': 32.8938, 'lng': -97.0395, 'terminal': 'D'},
        'D30': {'lat': 32.8940, 'lng': -97.0390, 'terminal': 'D'},
        # Terminal E
        'E1': {'lat': 32.8900, 'lng': -97.0440, 'terminal': 'E'},
        'E5': {'lat': 32.8902, 'lng': -97.0435, 'terminal': 'E'},
        'E10': {'lat': 32.8905, 'lng': -97.0430, 'terminal': 'E'},
        'E15': {'lat': 32.8908, 'lng': -97.0425, 'terminal': 'E'},
        'E20': {'lat': 32.8910, 'lng': -97.0420, 'terminal': 'E'},
        'E25': {'lat': 32.8912, 'lng': -97.0415, 'terminal': 'E'},
        'E30': {'lat': 32.8915, 'lng': -97.0410, 'terminal': 'E'},
    },
    'ORD': {
        # Terminal 1
        'B1': {'lat': 41.9792, 'lng': -87.9040, 'terminal': '1'},
        'B5': {'lat': 41.9795, 'lng': -87.9035, 'terminal': '1'},
        'B10': {'lat': 41.9798, 'lng': -87.9030, 'terminal': '1'},
        'B15': {'lat': 41.9800, 'lng': -87.9025, 'terminal': '1'},
        'B20': {'lat': 41.9802, 'lng': -87.9020, 'terminal': '1'},
        'C1': {'lat': 41.9805, 'lng': -87.9015, 'terminal': '1'},
        'C5': {'lat': 41.9808, 'lng': -87.9010, 'terminal': '1'},
        'C10': {'lat': 41.9810, 'lng': -87.9005, 'terminal': '1'},
        # Terminal 2
        'E1': {'lat': 41.9770, 'lng': -87.9060, 'terminal': '2'},
        'E5': {'lat': 41.9772, 'lng': -87.9055, 'terminal': '2'},
        'E10': {'lat': 41.9775, 'lng': -87.9050, 'terminal': '2'},
        'F1': {'lat': 41.9778, 'lng': -87.9045, 'terminal': '2'},
        'F5': {'lat': 41.9780, 'lng': -87.9040, 'terminal': '2'},
        'F10': {'lat': 41.9782, 'lng': -87.9035, 'terminal': '2'},
        # Terminal 3
        'G1': {'lat': 41.9750, 'lng': -87.9080, 'terminal': '3'},
        'G5': {'lat': 41.9752, 'lng': -87.9075, 'terminal': '3'},
        'G10': {'lat': 41.9755, 'lng': -87.9070, 'terminal': '3'},
        'H1': {'lat': 41.9758, 'lng': -87.9065, 'terminal': '3'},
        'H5': {'lat': 41.9760, 'lng': -87.9060, 'terminal': '3'},
        'H10': {'lat': 41.9762, 'lng': -87.9055, 'terminal': '3'},
        'K1': {'lat': 41.9765, 'lng': -87.9050, 'terminal': '3'},
        'K5': {'lat': 41.9768, 'lng': -87.9045, 'terminal': '3'},
    },
    'LAX': {
        # Terminal 4 (American Airlines)
        '40': {'lat': 33.9428, 'lng': -118.4060, 'terminal': '4'},
        '41': {'lat': 33.9430, 'lng': -118.4058, 'terminal': '4'},
        '42': {'lat': 33.9432, 'lng': -118.4056, 'terminal': '4'},
        '43': {'lat': 33.9434, 'lng': -118.4054, 'terminal': '4'},
        '44': {'lat': 33.9436, 'lng': -118.4052, 'terminal': '4'},
        '45': {'lat': 33.9438, 'lng': -118.4050, 'terminal': '4'},
        '46': {'lat': 33.9440, 'lng': -118.4048, 'terminal': '4'},
        '47': {'lat': 33.9442, 'lng': -118.4046, 'terminal': '4'},
        '48': {'lat': 33.9444, 'lng': -118.4044, 'terminal': '4'},
        # Terminal 5
        '50': {'lat': 33.9410, 'lng': -118.4080, 'terminal': '5'},
        '51': {'lat': 33.9412, 'lng': -118.4078, 'terminal': '5'},
        '52': {'lat': 33.9414, 'lng': -118.4076, 'terminal': '5'},
        '53': {'lat': 33.9416, 'lng': -118.4074, 'terminal': '5'},
        '54': {'lat': 33.9418, 'lng': -118.4072, 'terminal': '5'},
        '55': {'lat': 33.9420, 'lng': -118.4070, 'terminal': '5'},
    },
    'JFK': {
        # Terminal 8 (American Airlines)
        '1': {'lat': 40.6440, 'lng': -73.7860, 'terminal': '8'},
        '2': {'lat': 40.6442, 'lng': -73.7858, 'terminal': '8'},
        '3': {'lat': 40.6444, 'lng': -73.7856, 'terminal': '8'},
        '4': {'lat': 40.6446, 'lng': -73.7854, 'terminal': '8'},
        '5': {'lat': 40.6448, 'lng': -73.7852, 'terminal': '8'},
        '6': {'lat': 40.6450, 'lng': -73.7850, 'terminal': '8'},
        '7': {'lat': 40.6452, 'lng': -73.7848, 'terminal': '8'},
        '8': {'lat': 40.6454, 'lng': -73.7846, 'terminal': '8'},
        '9': {'lat': 40.6456, 'lng': -73.7844, 'terminal': '8'},
        '10': {'lat': 40.6458, 'lng': -73.7842, 'terminal': '8'},
    },
    'MIA': {
        # Concourse D (American Airlines)
        'D1': {'lat': 25.7960, 'lng': -80.2760, 'terminal': 'D'},
        'D5': {'lat': 25.7962, 'lng': -80.2755, 'terminal': 'D'},
        'D10': {'lat': 25.7965, 'lng': -80.2750, 'terminal': 'D'},
        'D15': {'lat': 25.7968, 'lng': -80.2745, 'terminal': 'D'},
        'D20': {'lat': 25.7970, 'lng': -80.2740, 'terminal': 'D'},
        'D25': {'lat': 25.7972, 'lng': -80.2735, 'terminal': 'D'},
        'D30': {'lat': 25.7975, 'lng': -80.2730, 'terminal': 'D'},
        'D35': {'lat': 25.7978, 'lng': -80.2725, 'terminal': 'D'},
        'D40': {'lat': 25.7980, 'lng': -80.2720, 'terminal': 'D'},
    },
    'PHX': {
        # Terminal 4 (American Airlines)
        'A1': {'lat': 33.4360, 'lng': -112.0080, 'terminal': '4'},
        'A5': {'lat': 33.4362, 'lng': -112.0075, 'terminal': '4'},
        'A10': {'lat': 33.4365, 'lng': -112.0070, 'terminal': '4'},
        'A15': {'lat': 33.4368, 'lng': -112.0065, 'terminal': '4'},
        'A20': {'lat': 33.4370, 'lng': -112.0060, 'terminal': '4'},
        'B1': {'lat': 33.4340, 'lng': -112.0100, 'terminal': '4'},
        'B5': {'lat': 33.4342, 'lng': -112.0095, 'terminal': '4'},
        'B10': {'lat': 33.4345, 'lng': -112.0090, 'terminal': '4'},
        'B15': {'lat': 33.4348, 'lng': -112.0085, 'terminal': '4'},
        'B20': {'lat': 33.4350, 'lng': -112.0080, 'terminal': '4'},
    },
    'PIT': {
        # Pittsburgh International Airport - Airside Terminal
        'A1': {'lat': 40.4955, 'lng': -80.2425, 'terminal': 'Airside'},
        'A5': {'lat': 40.4957, 'lng': -80.2420, 'terminal': 'Airside'},
        'A10': {'lat': 40.4960, 'lng': -80.2415, 'terminal': 'Airside'},
        'A15': {'lat': 40.4962, 'lng': -80.2410, 'terminal': 'Airside'},
        'A20': {'lat': 40.4965, 'lng': -80.2405, 'terminal': 'Airside'},
        'B1': {'lat': 40.4950, 'lng': -80.2420, 'terminal': 'Airside'},
        'B5': {'lat': 40.4952, 'lng': -80.2415, 'terminal': 'Airside'},
        'B10': {'lat': 40.4955, 'lng': -80.2410, 'terminal': 'Airside'},
        'B15': {'lat': 40.4957, 'lng': -80.2405, 'terminal': 'Airside'},
        'B20': {'lat': 40.4960, 'lng': -80.2400, 'terminal': 'Airside'},
        'B22': {'lat': 40.4958, 'lng': -80.2413, 'terminal': 'Airside'},
        'B25': {'lat': 40.4962, 'lng': -80.2395, 'terminal': 'Airside'},
        'C1': {'lat': 40.4945, 'lng': -80.2430, 'terminal': 'Airside'},
        'C5': {'lat': 40.4947, 'lng': -80.2425, 'terminal': 'Airside'},
        'C10': {'lat': 40.4950, 'lng': -80.2420, 'terminal': 'Airside'},
    },
}

# Airport geofences for detecting when user enters airport
AIRPORT_GEOFENCES = {
    'DFW': {
        'lat': 32.8968,
        'lng': -97.0380,
        'radius_km': 5,
        'name': 'Dallas/Fort Worth International Airport',
    },
    'ORD': {
        'lat': 41.9742,
        'lng': -87.9073,
        'radius_km': 4,
        'name': "O'Hare International Airport",
    },
    'LAX': {
        'lat': 33.9425,
        'lng': -118.4081,
        'radius_km': 3,
        'name': 'Los Angeles International Airport',
    },
    'JFK': {
        'lat': 40.6413,
        'lng': -73.7781,
        'radius_km': 3,
        'name': 'John F. Kennedy International Airport',
    },
    'MIA': {
        'lat': 25.7959,
        'lng': -80.2870,
        'radius_km': 3,
        'name': 'Miami International Airport',
    },
    'PHX': {
        'lat': 33.4373,
        'lng': -112.0078,
        'radius_km': 3,
        'name': 'Phoenix Sky Harbor International Airport',
    },
    'CLT': {
        'lat': 35.2140,
        'lng': -80.9431,
        'radius_km': 3,
        'name': 'Charlotte Douglas International Airport',
    },
    'DCA': {
        'lat': 38.8512,
        'lng': -77.0402,
        'radius_km': 2,
        'name': 'Ronald Reagan Washington National Airport',
    },
    'LGA': {
        'lat': 40.7769,
        'lng': -73.8740,
        'radius_km': 2,
        'name': 'LaGuardia Airport',
    },
    'PIT': {
        'lat': 40.4958,
        'lng': -80.2413,
        'radius_km': 3,
        'name': 'Pittsburgh International Airport',
    },
}

# Terminal locations within airports (for general navigation)
AIRPORT_TERMINALS = {
    'DFW': {
        'A': {'lat': 32.9010, 'lng': -97.0355, 'name': 'Terminal A'},
        'B': {'lat': 32.8985, 'lng': -97.0365, 'name': 'Terminal B'},
        'C': {'lat': 32.8958, 'lng': -97.0385, 'name': 'Terminal C'},
        'D': {'lat': 32.8935, 'lng': -97.0400, 'name': 'Terminal D'},
        'E': {'lat': 32.8908, 'lng': -97.0425, 'name': 'Terminal E'},
    },
    'ORD': {
        '1': {'lat': 41.9800, 'lng': -87.9025, 'name': 'Terminal 1'},
        '2': {'lat': 41.9775, 'lng': -87.9050, 'name': 'Terminal 2'},
        '3': {'lat': 41.9755, 'lng': -87.9070, 'name': 'Terminal 3'},
        '5': {'lat': 41.9730, 'lng': -87.9090, 'name': 'Terminal 5 (International)'},
    },
    'PIT': {
        'Airside': {'lat': 40.4955, 'lng': -80.2415, 'name': 'Airside Terminal'},
        'Landside': {'lat': 40.4920, 'lng': -80.2370, 'name': 'Landside Terminal'},
    },
}

# Average walking speeds (meters per minute)
WALKING_SPEEDS = {
    'normal': 80,      # ~5 km/h
    'elderly': 50,     # ~3 km/h (slower pace for elderly)
    'rushed': 100,     # ~6 km/h
}


def get_gate_location(airport_code: str, gate: str) -> Optional[Dict[str, Any]]:
    """
    Get the coordinates for a specific gate at an airport.

    Args:
        airport_code: IATA airport code (e.g., 'DFW')
        gate: Gate identifier (e.g., 'B22')

    Returns:
        Dict with lat, lng, terminal or None if not found
    """
    airport_gates = AIRPORT_GATES.get(airport_code.upper(), {})

    # Try exact match first
    if gate.upper() in airport_gates:
        return airport_gates[gate.upper()]

    # Try without leading zeros
    gate_stripped = gate.upper().lstrip('0')
    if gate_stripped in airport_gates:
        return airport_gates[gate_stripped]

    # If gate not found, return terminal center if we can determine terminal
    if gate:
        terminal = gate[0].upper()  # First character is usually terminal
        terminals = AIRPORT_TERMINALS.get(airport_code.upper(), {})
        if terminal in terminals:
            term_data = terminals[terminal]
            return {
                'lat': term_data['lat'],
                'lng': term_data['lng'],
                'terminal': terminal,
                'approximate': True,
            }

    return None


def get_airport_geofence(airport_code: str) -> Optional[Dict[str, Any]]:
    """
    Get the geofence data for an airport.

    Args:
        airport_code: IATA airport code

    Returns:
        Dict with lat, lng, radius_km, name or None
    """
    return AIRPORT_GEOFENCES.get(airport_code.upper())


def get_terminal_location(airport_code: str, terminal: str) -> Optional[Dict[str, Any]]:
    """
    Get the center coordinates for a terminal.

    Args:
        airport_code: IATA airport code
        terminal: Terminal identifier

    Returns:
        Dict with lat, lng, name or None
    """
    terminals = AIRPORT_TERMINALS.get(airport_code.upper(), {})
    return terminals.get(terminal.upper())


def find_nearest_airport(lat: float, lng: float) -> Optional[Tuple[str, float]]:
    """
    Find the nearest airport to a given location.

    Args:
        lat: Latitude
        lng: Longitude

    Returns:
        Tuple of (airport_code, distance_km) or None if no airport within 10km
    """
    from math import radians, sin, cos, sqrt, atan2

    def haversine(lat1, lon1, lat2, lon2):
        R = 6371  # Earth's radius in km
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        return R * c

    nearest = None
    min_distance = float('inf')

    for code, geofence in AIRPORT_GEOFENCES.items():
        distance = haversine(lat, lng, geofence['lat'], geofence['lng'])
        if distance < min_distance and distance <= 10:  # Within 10km
            min_distance = distance
            nearest = code

    if nearest:
        return (nearest, min_distance)
    return None


def get_simple_directions(
    from_lat: float,
    from_lng: float,
    to_gate: str,
    airport_code: str,
    language: str = 'en'
) -> str:
    """
    Generate simple text directions to a gate.

    Args:
        from_lat: Current latitude
        from_lng: Current longitude
        to_gate: Destination gate
        airport_code: Airport code
        language: 'en' or 'es'

    Returns:
        Simple direction text
    """
    gate_location = get_gate_location(airport_code, to_gate)
    if not gate_location:
        if language == 'es':
            return f"Dirijase a la puerta {to_gate}. Consulte las pantallas del aeropuerto."
        return f"Head towards gate {to_gate}. Check airport displays for directions."

    terminal = gate_location.get('terminal', '')

    # Calculate general direction
    lat_diff = gate_location['lat'] - from_lat
    lng_diff = gate_location['lng'] - from_lng

    if abs(lat_diff) > abs(lng_diff):
        direction = 'north' if lat_diff > 0 else 'south'
        direction_es = 'norte' if lat_diff > 0 else 'sur'
    else:
        direction = 'east' if lng_diff > 0 else 'west'
        direction_es = 'este' if lng_diff > 0 else 'oeste'

    if language == 'es':
        if terminal:
            return f"Dirijase hacia el {direction_es} hacia la Terminal {terminal}. Su puerta {to_gate} esta en esa direccion."
        return f"Dirijase hacia el {direction_es} hacia la puerta {to_gate}."

    if terminal:
        return f"Head {direction} towards Terminal {terminal}. Gate {to_gate} is in that direction."
    return f"Head {direction} towards gate {to_gate}."
