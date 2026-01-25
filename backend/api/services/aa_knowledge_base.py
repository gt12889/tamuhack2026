"""
American Airlines Knowledge Base
Contains company information, policies, and airport knowledge for the AI agent.
"""

# American Airlines Company Information
AMERICAN_AIRLINES_INFO = """
AMERICAN AIRLINES COMPANY INFORMATION:

About American Airlines:
- Founded in 1926, one of the world's largest airlines
- Headquarters: Fort Worth, Texas
- Hub airports: Dallas/Fort Worth (DFW), Charlotte (CLT), Chicago O'Hare (ORD), Miami (MIA), Los Angeles (LAX), Philadelphia (PHL), Phoenix (PHX)
- Fleet: Over 900 aircraft serving 350+ destinations worldwide
- AAdvantage program: Frequent flyer program with miles and elite status tiers

Key Policies:
- Check-in: Available 24 hours before departure online or at airport
- Baggage: First checked bag fees apply (varies by route and fare type)
- Seating: Seat selection available at booking or check-in
- Changes: Flight changes allowed with fees (varies by fare type)
- Cancellations: Refundable fares can be cancelled, non-refundable get credit
- Standby: Same-day standby available for AAdvantage members
- Boarding: Group boarding (Group 1-9) based on status and fare class

Common Services:
- Wheelchair assistance: Available upon request, request at booking or 48 hours before
- Unaccompanied minors: Available for children 5-14 years old
- Special meals: Request 24+ hours before departure
- Priority boarding: For AAdvantage elite members and premium cabin passengers
- Admirals Club: Airport lounges available for members and premium passengers
"""

# Major Airport Information - Detailed Knowledge Base
AIRPORT_KNOWLEDGE = """
MAJOR AMERICAN AIRLINES AIRPORTS - DETAILED INFORMATION:

================================================================================
DALLAS/FORT WORTH INTERNATIONAL (DFW) - MAIN HUB
================================================================================

Terminals: 5 terminals (A, B, C, D, E) arranged in a horseshoe shape

TERMINAL A:
- Gates: A1-A38 (mostly regional flights, American Eagle)
- Admirals Club: Near Gate A24 (Level 3)
- Food: Multiple restaurants and cafes throughout
- Restrooms: Every 4-6 gates
- Charging stations: Near most gates
- Walking time: ~2-3 minutes between gates, ~5-7 minutes end-to-end
- Navigation: Follow signs with blue "A" terminal markers

TERMINAL B:
- Gates: B1-B49 (main domestic hub, many American Airlines flights)
- Admirals Club: Near Gate B24 (Level 3), also near Gate B4
- Food: Wide variety including sit-down restaurants
- Restrooms: Every 4-6 gates
- Charging stations: Abundant, near gates and seating areas
- Walking time: ~2-3 minutes between gates, ~8-10 minutes end-to-end
- Navigation: Follow signs with green "B" terminal markers
- Key gates: B20-B30 are central, B1-B10 near security, B40-B49 far end

TERMINAL C:
- Gates: C1-C39 (international and domestic flights)
- Admirals Club: Near Gate C20 (Level 3)
- Food: International food court, multiple options
- Restrooms: Every 4-6 gates
- Charging stations: Near gates
- Walking time: ~2-3 minutes between gates, ~7-9 minutes end-to-end
- Navigation: Follow signs with yellow "C" terminal markers

TERMINAL D:
- Gates: D1-D40 (international arrivals, customs, some departures)
- Admirals Club: Near Gate D22 (Level 3), also near Gate D6
- Food: International dining options
- Customs: Located on lower level after international arrivals
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates, ~8-10 minutes end-to-end
- Navigation: Follow signs with red "D" terminal markers

TERMINAL E:
- Gates: E1-E31 (international departures)
- Admirals Club: Near Gate E12 (Level 3)
- Food: International options
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates, ~6-8 minutes end-to-end
- Navigation: Follow signs with purple "E" terminal markers

SKYLINK TRAIN SYSTEM:
- Free automated train connecting all 5 terminals
- Runs 24/7, every 2-3 minutes
- Stations: Each terminal has 2 Skylink stations (one at each end)
- Travel time: ~2-3 minutes between terminals
- How to use: Follow "Skylink" signs, take escalator/elevator to train level
- Accessibility: Wheelchair accessible, elevators available

NAVIGATION BETWEEN TERMINALS:
- Terminal A to B: ~5-7 minutes via Skylink, or ~15-20 minutes walking
- Terminal B to C: ~2-3 minutes via Skylink
- Terminal C to D: ~2-3 minutes via Skylink
- Terminal D to E: ~2-3 minutes via Skylink
- Always use Skylink for terminal changes - it's faster and easier

PARKING:
- Terminal Parking: Closest to terminals, most expensive, recommended for convenience
- Express Parking: Covered parking, shuttle to terminals
- Remote Parking: Farthest, cheapest, shuttle required
- Valet Parking: Available at all terminals

AMENITIES:
- Admirals Club locations: Terminals A (Gate A24), B (Gates B4, B24), C (Gate C20), D (Gates D6, D22), E (Gate E12)
- Restrooms: Every 4-6 gates, clearly marked
- Food: Wide variety in all terminals, food courts in B and C
- Shopping: Newsstands, gift shops, duty-free in D and E
- Charging: USB and power outlets near most gates
- Information Desks: Near security in each terminal
- Wheelchair assistance: Request at check-in or gate, available 24/7

================================================================================
CHICAGO O'HARE INTERNATIONAL (ORD) - HUB
================================================================================

Terminals: 4 terminals (1, 2, 3, 5) - Terminal 4 is international only

TERMINAL 1:
- Gates: B1-B20, C1-C30 (United Airlines main terminal)
- Not primarily American Airlines

TERMINAL 2:
- Gates: E1-E11, F1-F20 (Mixed airlines)
- Some American Airlines flights

TERMINAL 3 - MAIN AMERICAN AIRLINES TERMINAL:
- Gates: G1-G21, H1-H32, K1-K20, L1-L20
- Admirals Club: Near Gate H6 (Concourse H, Level 2)
- Food: Multiple restaurants, food court near Gate H
- Restrooms: Every 4-6 gates
- Charging stations: Near gates and seating
- Walking time: ~2-3 minutes between gates, ~10-12 minutes end-to-end
- Navigation: Follow overhead signs, use moving walkways
- Key areas: Gates H1-H15 are central, H16-H32 are farther

TERMINAL 5:
- International terminal
- Some American Airlines international flights
- Customs and immigration on lower level

ATS (AIRPORT TRANSIT SYSTEM):
- Free automated train connecting Terminals 1, 2, 3
- Terminal 5 requires separate shuttle or walk
- Runs 24/7, every 2-3 minutes
- Travel time: ~2-3 minutes between terminals 1-3
- How to use: Follow "ATS" signs, take escalator/elevator down

NAVIGATION:
- Terminal 3 is large - allow extra time to reach gates
- Moving walkways available in most concourses
- Follow overhead signs with gate numbers
- Information desks near security checkpoints

PARKING:
- Terminal Parking: Closest, most expensive
- Economy Parking: Farther, cheaper, shuttle required
- Valet: Available

AMENITIES:
- Admirals Club: Terminal 3, Concourse H, near Gate H6
- Restrooms: Every 4-6 gates
- Food: Wide variety in Terminal 3
- Shopping: Newsstands, gift shops throughout
- Charging: Available near gates

================================================================================
MIAMI INTERNATIONAL (MIA) - HUB
================================================================================

Layout: North Terminal (Concourse D) and Central Terminal (Concourse E)

CONCOURSE D - MAIN AMERICAN AIRLINES AREA:
- Gates: D1-D60 (American Airlines domestic and international)
- Admirals Club: Near Gate D30 (Level 3), also near Gate D15
- Food: International food court, Latin American cuisine
- Restrooms: Every 4-6 gates
- Charging stations: Near gates
- Walking time: ~2-3 minutes between gates, ~12-15 minutes end-to-end
- Navigation: Follow concourse signs, use moving walkways
- Key: D1-D20 are closer to security, D40-D60 are farther

CONCOURSE E:
- Gates: E1-E40 (American Airlines and partner airlines)
- Admirals Club: Near Gate E11 (Level 3)
- Food: Multiple dining options
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates, ~10-12 minutes end-to-end

NAVIGATION:
- Concourses D and E are connected via moving walkways
- Walking time between D and E: ~5-7 minutes
- Follow overhead signs with gate numbers
- Information desks near security

PARKING:
- Dolphin Garage: Closest to terminals
- Flamingo Garage: Covered parking
- Economy Parking: Farther, shuttle required

AMENITIES:
- Admirals Club: Concourse D (Gates D15, D30), Concourse E (Gate E11)
- Restrooms: Every 4-6 gates
- Food: Extensive options, especially Latin American cuisine
- Shopping: Duty-free, gift shops
- Charging: Available near gates

================================================================================
LOS ANGELES INTERNATIONAL (LAX) - HUB
================================================================================

Terminals: Terminal 4 and Terminal 5 for American Airlines

TERMINAL 4:
- Gates: 40-59 (American Airlines main terminal)
- Admirals Club: Near Gate 44 (Level 5)
- Food: Multiple restaurants and cafes
- Restrooms: Every 4-6 gates
- Charging stations: Near gates
- Walking time: ~2-3 minutes between gates, ~6-8 minutes end-to-end
- Navigation: Follow gate number signs

TERMINAL 5:
- Gates: 50-69 (American Airlines and partner flights)
- Connected to Terminal 4 via walkway
- Food: Multiple options
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates

NAVIGATION:
- Terminal 4 and 5 are connected - can walk between them (~3-5 minutes)
- Follow overhead signs with gate numbers
- Information desks near security

PARKING:
- Terminal Parking: Closest, most expensive
- Economy Parking: Farther, shuttle required
- Valet: Available

AMENITIES:
- Admirals Club: Terminal 4, near Gate 44
- Restrooms: Every 4-6 gates
- Food: Wide variety
- Shopping: Newsstands, gift shops
- Charging: Available near gates

================================================================================
CHARLOTTE DOUGLAS INTERNATIONAL (CLT) - HUB
================================================================================

Layout: Single terminal building with 5 concourses (A, B, C, D, E)

CONCOURSE A:
- Gates: A1-A36 (American Airlines regional and some mainline)
- Food: Multiple options
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates, ~10-12 minutes end-to-end

CONCOURSE B:
- Gates: B1-B36 (American Airlines mainline)
- Admirals Club: Near Gate B8 (Level 2)
- Food: Food court and restaurants
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates, ~10-12 minutes end-to-end

CONCOURSE C:
- Gates: C1-C36 (American Airlines mainline)
- Admirals Club: Near Gate C4 (Level 2)
- Food: Multiple options
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates, ~10-12 minutes end-to-end

CONCOURSE D:
- Gates: D1-D36 (American Airlines mainline and international)
- Admirals Club: Near Gate D8 (Level 2)
- Food: Multiple options
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates, ~10-12 minutes end-to-end

CONCOURSE E:
- Gates: E1-E36 (American Airlines mainline)
- Food: Multiple options
- Restrooms: Every 4-6 gates
- Walking time: ~2-3 minutes between gates, ~10-12 minutes end-to-end

NAVIGATION:
- All concourses connected via central atrium
- Walking between adjacent concourses: ~3-5 minutes
- Moving walkways in most concourses
- Follow overhead signs with gate numbers
- Information desks in central atrium

PARKING:
- Hourly Parking: Closest, most expensive
- Daily Parking: Covered, moderate price
- Long-term Parking: Farther, shuttle required

AMENITIES:
- Admirals Club: Concourse B (Gate B8), C (Gate C4), D (Gate D8)
- Restrooms: Every 4-6 gates
- Food: Extensive food court in central atrium
- Shopping: Newsstands, gift shops throughout
- Charging: Available near gates

================================================================================
PHILADELPHIA INTERNATIONAL (PHL) - HUB
================================================================================

Terminals: A-East, A-West, B, C, D, E, F

TERMINAL A-WEST - MAIN AMERICAN AIRLINES TERMINAL:
- Gates: A14-A26 (American Airlines mainline)
- Admirals Club: Near Gate A15 (Level 2)
- Food: Multiple restaurants
- Restrooms: Every 4-6 gates
- Charging stations: Near gates
- Walking time: ~2-3 minutes between gates, ~4-5 minutes end-to-end
- Navigation: Follow signs with "A-West" designation

TERMINAL A-EAST:
- Gates: A1-A13 (American Airlines regional)
- Connected to A-West
- Food: Limited options
- Restrooms: Every 4-6 gates

TERMINAL B:
- Some American Airlines flights
- Connected to Terminal A

TERMINAL C, D, E, F:
- Other airlines, some American Airlines connections

NAVIGATION:
- Terminals connected via walkways
- Walking between A-West and A-East: ~2-3 minutes
- Follow overhead signs
- Information desks near security

PARKING:
- Terminal Parking: Closest
- Economy Parking: Farther, shuttle required

AMENITIES:
- Admirals Club: Terminal A-West, near Gate A15
- Restrooms: Every 4-6 gates
- Food: Multiple options in A-West
- Shopping: Newsstands, gift shops
- Charging: Available near gates

================================================================================
PHOENIX SKY HARBOR (PHX) - HUB
================================================================================

Terminals: Terminal 3 and Terminal 4

TERMINAL 3:
- Some American Airlines flights
- Gates: 1-20
- Food: Limited options
- Restrooms: Every 4-6 gates

TERMINAL 4 - MAIN AMERICAN AIRLINES TERMINAL:
- Gates: A1-A20, B1-B28, C1-C20 (American Airlines main hub)
- Admirals Club: Near Gate A7 (Level 2), also near Gate B7
- Food: Extensive food court, multiple restaurants
- Restrooms: Every 4-6 gates
- Charging stations: Near gates
- Walking time: ~2-3 minutes between gates, ~8-10 minutes end-to-end
- Navigation: Follow concourse signs (A, B, C)
- Key: Concourse B is largest, Gates B1-B14 are central

NAVIGATION:
- Terminal 3 and 4 connected via Sky Train (free, runs 24/7)
- Walking between terminals: ~10-15 minutes or use Sky Train (~2 minutes)
- Moving walkways in Terminal 4
- Follow overhead signs
- Information desks near security

PARKING:
- Terminal 4 Parking: Closest to Terminal 4
- Economy Parking: Farther, shuttle required

AMENITIES:
- Admirals Club: Terminal 4, Concourse A (Gate A7), Concourse B (Gate B7)
- Restrooms: Every 4-6 gates
- Food: Extensive options in Terminal 4
- Shopping: Newsstands, gift shops
- Charging: Available near gates

================================================================================
GENERAL AIRPORT NAVIGATION TIPS:
================================================================================

GATE ASSIGNMENTS:
- Always check departure boards - gates can change
- Gate numbers follow pattern: Terminal/Concourse letter + number (e.g., B22, A10, H15)
- Lower numbers usually closer to security, higher numbers farther
- Allow extra time for gates at far ends of terminals

WALKING TIMES (elderly pace ~50 meters/minute):
- Between adjacent gates: 2-3 minutes
- End-to-end of typical concourse: 8-12 minutes
- Between terminals (via train): 2-3 minutes train + 2-3 minutes walking
- Between terminals (walking): 10-20 minutes depending on airport

ARRIVAL TIMES:
- Domestic flights: Arrive at least 2 hours before departure
- International flights: Arrive at least 3 hours before departure
- During peak times: Add 30-60 minutes extra
- If checking bags: Add 15-30 minutes

SIGNAGE:
- Follow overhead signs with gate numbers
- Look for terminal/concourse letters (A, B, C, etc.)
- Information desks marked with "i" symbol
- Restrooms marked with standard symbols
- Food courts usually in central areas

AMENITIES LOCATIONS:
- Restrooms: Every 4-6 gates, clearly marked
- Food: Usually in central areas of terminals, food courts near main gates
- Charging: Near most gates, look for seating areas with outlets
- Information Desks: Near security checkpoints, marked with "i"
- Admirals Club: Usually near central gates, Level 2 or 3
- Wheelchair assistance: Available at check-in, security, or gates

ASSISTANCE:
- Airport staff: Available throughout terminals, look for uniforms
- Information desks: Can provide maps and directions
- Wheelchair assistance: Request at booking, check-in, or gate
- Lost and found: Usually near information desks
- Medical assistance: Available, ask any airport staff

TERMINAL TRANSFERS:
- Use airport trains when available (Skylink at DFW, ATS at ORD, Sky Train at PHX)
- Trains are free, run frequently (every 2-3 minutes), wheelchair accessible
- Walking between terminals: Possible but time-consuming (10-20 minutes)
- Always allow extra time for terminal transfers
"""

# Airport Code Mappings (for natural language understanding)
AIRPORT_CODE_MAPPINGS = """
AIRPORT CODE REFERENCE:

Common City to Airport Code Mappings:
- Dallas / DFW → DFW (Dallas/Fort Worth International)
- Chicago / O'Hare → ORD (Chicago O'Hare International)
- Los Angeles / LA → LAX (Los Angeles International)
- New York / NYC / JFK → JFK (John F. Kennedy International)
- Miami → MIA (Miami International)
- Phoenix → PHX (Phoenix Sky Harbor)
- Charlotte → CLT (Charlotte Douglas International)
- Philadelphia → PHL (Philadelphia International)
- Washington / DCA / Reagan → DCA (Ronald Reagan Washington National)
- Boston → BOS (Boston Logan International)
- San Francisco → SFO (San Francisco International)
- Seattle → SEA (Seattle-Tacoma International)
- Denver → DEN (Denver International)
- Atlanta → ATL (Hartsfield-Jackson Atlanta International)
- Pittsburgh → PIT (Pittsburgh International)
- Honolulu / Hawaii → HNL (Daniel K. Inouye International)

When users mention cities, recognize both the city name and airport code.
"""

# Flight Information Knowledge
FLIGHT_KNOWLEDGE = """
FLIGHT INFORMATION:

Flight Number Format:
- American Airlines flights start with "AA" followed by 1-4 digits
- Examples: AA100, AA1234, AA1
- Regional flights may use different codes (operated by regional partners)

Confirmation Code:
- 6-7 character alphanumeric code
- Format: Usually letters and numbers (e.g., DEMO123, ABC1234)
- Can be spelled out letter by letter if needed

Seat Assignments:
- Window seats: A or F (varies by aircraft)
- Aisle seats: C or D (varies by aircraft)
- Middle seats: B or E (varies by aircraft)
- Premium seats: Extra legroom, exit rows, preferred seating
- Seat selection: Available at booking or check-in

Gate Information:
- Gate assignments posted on departure boards
- Gates can change - always check boards before heading to gate
- Boarding typically starts 30-45 minutes before departure
- Final boarding usually 10-15 minutes before departure
"""

# Combine all knowledge
AA_KNOWLEDGE_BASE = f"""
{AMERICAN_AIRLINES_INFO}

{AIRPORT_KNOWLEDGE}

{AIRPORT_CODE_MAPPINGS}

{FLIGHT_KNOWLEDGE}
"""
