import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, StyleSheet, View, ActivityIndicator, TouchableOpacity } from "react-native";
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

export default function TravelDashboard() {
  const params = useLocalSearchParams();
  // Support both 'code' (from index.tsx) and 'linkId' (from web helper links)
  const code = (params.code as string) || (params.linkId as string) || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!code) {
      // No code provided - use demo mode
      setReservation(DEMO_RESERVATION);
      setLoading(false);
      return;
    }

    try {
      // First try as a helper link ID
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
        // Not a helper link, try as confirmation code
      }

      // Try as a confirmation code
      try {
        const res = await lookupReservation({ confirmation_code: code });
        if (res) {
          setReservation(res);
          setError(null);
          setLoading(false);
          return;
        }
      } catch {
        // Confirmation code lookup failed
      }

      // Neither worked - use demo mode with the entered code
      console.log('Using demo mode for code:', code);
      setReservation({
        ...DEMO_RESERVATION,
        confirmation_code: code.toUpperCase(),
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      // Fall back to demo on any error
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

  // Loading state - show spinner
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

  // Error state
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

  // Success state - show reservation data
  const displayReservation = reservation || DEMO_RESERVATION;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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

        <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
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
});
