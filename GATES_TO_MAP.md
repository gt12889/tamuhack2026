# Gates Used in Demos - Mapping Status

## DFW Airport Gates Used in Demos

### Terminal A Gates (Need Mapping)
- **A8** - Used in demo scenarios (delayed flight scenario)
- **A10** - Used in dfwDemoData.ts (landmarks, waypoints)
- **A12** - Used in demo scenarios (rebooking scenario) and mock_data.py
- **A15** - Used in dfwDemoData.ts (landmarks, restaurants)
- **A22** - Used in dfwDemoData.ts (landmarks, Starbucks)
- **A25** - Used in dfwDemoData.ts (landmarks, restrooms)
- **A26** - Used in dfwDemoData.ts (landmarks, charging stations)

### Terminal B Gates (Partially Mapped)
- **B7** - Used in mock_data.py
- **B15** - Used in demo scenarios, dfwDemoData.ts, mock_data.py, handoffDemoData.ts
- **B17** - Used in dfwDemoData.ts (Whataburger location)
- **B20** - ✅ Already mapped (from your 12-point path)
- **B21** - ✅ Already mapped (from your 12-point path)
- **B22** - ✅ Already mapped (from your 12-point path)

### Terminal C Gates (Partially Mapped)
- **C3** - Used in mock_data.py
- **C15** - Used in demo scenarios (wheelchair assistance scenario)
- **C1-C9** - ✅ Already mapped (from your 9-point path)

### Terminal D Gates (Need Mapping)
- **D8** - Used in demo scenarios (Spanish language scenario)
- **D12** - Used in demo scenarios (emergency change scenario)
- **D15** - Used in mock_data.py

## Summary

**Already Mapped:**
- Terminal B: B11-B22 (12 gates from your path)
- Terminal C: C1-C9 (9 gates from your path)

**Still Need Mapping:**
- Terminal A: A8, A10, A12, A15, A22, A25, A26 (7 gates)
- Terminal B: B7, B15, B17 (3 gates)
- Terminal C: C3, C15 (2 gates - note: C15 is different from C1-C9 path)
- Terminal D: D8, D12, D15 (3 gates)

**Total Remaining:** 15 gates

## Priority Order (by usage frequency)

1. **B15** - Most frequently used (appears in multiple demos)
2. **A12** - Used in rebooking scenario
3. **C15** - Used in wheelchair assistance scenario
4. **D12** - Used in emergency change scenario
5. **A8** - Used in delayed flight scenario
6. **D8** - Used in Spanish language scenario
7. **B17** - Used for Whataburger landmark
8. **A15, A22, A25** - Used for landmarks/amenities
9. **A10, A26** - Used for landmarks
10. **B7, C3, D15** - Used in mock data
