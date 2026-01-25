import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
} from "react-native";
import PassengerCard from "@/components/ui/PassengerCard";
import FlightStatusCard from "@/components/ui/FlightStatusCard";
import type { Message, Reservation } from "@/types";
import { getHelperSession, lookupReservation } from '@/lib/api';
import { useLocalSearchParams, router } from "expo-router";

// Demo reservation fallback: PIT -> DFW, Monday January 19, 2026
const DEMO_RESERVATION: Reservation = {
  id: 'demo-res-001',
  confirmation_code: 'MEEMAW',
  passenger: {
    id: 'demo-pax-001',
    first_name: 'Margaret',
    last_name: 'Johnson',
    email: 'margaret.johnson@email.com',
    phone: '(555) 123-4567',
    aadvantage_number: '1234567890',
    preferences: {
      language: 'en',
      seat_preference: 'window',
    },
  },
  flights: [
    {
      id: 'demo-flight-001',
      flight_number: 'AA1845',
      origin: 'PIT',
      destination: 'DFW',
      departure_time: '2026-01-19T07:06:00-05:00',
      arrival_time: '2026-01-19T09:50:00-06:00',
      gate: 'B22',
      status: 'scheduled',
      seat: '14A',
    },
  ],
  status: 'confirmed',
  created_at: '2026-01-15T10:00:00Z',
};

// Quick action buttons for demo
const QUICK_ACTIONS = [
  { id: 'wheelchair', label: '♿ Wheelchair', color: '#3B82F6' },
  { id: 'directions', label: '🧭 Directions', color: '#10B981' },
  { id: 'water', label: '💧 Water', color: '#06B6D4' },
  { id: 'restroom', label: '🚻 Restroom', color: '#8B5CF6' },
];

export default function TravelDashboard() {
  const params = useLocalSearchParams();
  const code = (params.code as string) || (params.linkId as string) || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  // Pulsing animation for call button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const fetchData = useCallback(async () => {
    if (!code) {
      setReservation(DEMO_RESERVATION);
      setLoading(false);
      return;
    }

    try {
      try {
        const data = await getHelperSession(code);
        setMessages(data.messages as Message[]);
        if (data.reservation) {
          setReservation(data.reservation);
          setError(null);
          setLoading(false);
          return;
        }
      } catch {
        // Not a helper link
      }

      try {
        const res = await lookupReservation({ confirmation_code: code });
        if (res) {
          setReservation(res);
          setError(null);
          setLoading(false);
          return;
        }
      } catch {
        // Lookup failed
      }

      setReservation({
        ...DEMO_RESERVATION,
        confirmation_code: code.toUpperCase(),
      });
      setError(null);
    } catch (err) {
      setReservation(DEMO_RESERVATION);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGoBack = () => {
    router.back();
  };

  const handleCallMeeMaw = () => {
    setIsCallActive(true);
    Alert.alert(
      "📞 Calling MeeMaw...",
      "Connecting you to your AI travel assistant.\n\nIn the full app, this would start a voice call with ElevenLabs.",
      [
        {
          text: "End Call",
          onPress: () => setIsCallActive(false),
          style: "destructive",
        },
      ]
    );
  };

  const handleQuickAction = (actionId: string) => {
    const actionMessages: Record<string, string> = {
      wheelchair: "🦽 Requesting wheelchair assistance...\n\nA team member will meet you at your current location.",
      directions: "🧭 Getting directions to Gate B22...\n\nHead straight, then turn left at Starbucks. About 5 min walk.",
      water: "💧 Nearest water fountain:\n\nTerminal B, near Gate B18\n~2 minute walk from your location.",
      restroom: "🚻 Nearest restroom:\n\nTerminal B, past the Starbucks on your left.\n~1 minute walk.",
    };

    Alert.alert(
      "Quick Action",
      actionMessages[actionId] || "Action requested!",
      [{ text: "OK" }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerScreen}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading your trip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !reservation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerScreen}>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayReservation = reservation || DEMO_RESERVATION;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Live Status Indicator */}
        <View style={styles.statusBar}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Connected</Text>
          </View>
          <Text style={styles.statusTime}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <Text style={styles.header}>Travel Dashboard</Text>

        {code ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Confirmation Code</Text>
            <Text style={styles.codeValue}>{displayReservation.confirmation_code}</Text>
          </View>
        ) : null}

        <PassengerCard reservation={displayReservation} />

        {displayReservation.flights.map((flight: any) => (
          <FlightStatusCard key={flight.id} flight={flight} />
        ))}

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickActionButton, { backgroundColor: action.color }]}
              onPress={() => handleQuickAction(action.id)}
            >
              <Text style={styles.quickActionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
          <Text style={styles.refreshButtonText}>↻ Refresh</Text>
        </TouchableOpacity>

        {/* Spacer for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Call Button */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[styles.fab, isCallActive && styles.fabActive]}
          onPress={handleCallMeeMaw}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>{isCallActive ? '📞' : '🗣️'}</Text>
          <Text style={styles.fabText}>{isCallActive ? 'On Call' : 'Call MeeMaw'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  statusTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111827",
  },
  centerScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#6C63FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  codeBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4F46E5",
    letterSpacing: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  refreshButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
  },
  fab: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabActive: {
    backgroundColor: '#EF4444',
  },
  fabIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
