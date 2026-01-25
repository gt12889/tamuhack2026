import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, StyleSheet } from "react-native";
import PassengerCard from "@/components/ui/PassengerCard";
import FlightStatusCard from "@/components/ui/FlightStatusCard";
import type {Message,Reservation} from "@/types";
import { getHelperSession, sendHelperSuggestion } from '@/lib/api';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { router, useLocalSearchParams } from "expo-router";




const DEMO_RESERVATION: Reservation = {
  id: 'demo-res-001',
  confirmation_code: 'DEMO123',
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
      flight_number: 'AA1234',
      origin: 'DFW',
      destination: 'ORD',
      departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      arrival_time: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
      gate: 'B22',
      status: 'scheduled',
      seat: '14A',
    },
  ],
  status: 'confirmed',
  created_at: new Date().toISOString(),
};

export default function TravelDashboard() {
  const params = useLocalSearchParams();
  const linkId = params.linkId as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getHelperSession(linkId);
      setMessages(data.messages as Message[]);
      setReservation(data.reservation);
      // Auto-disable demo mode when real data arrives
      if (data.reservation) {
        setDemoMode(false);
      }
      setError(null);
    } catch (err) {
      setError('This helper link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    fetchSession();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim() || sending) return;

    setSending(true);
    try {
      await sendHelperSuggestion(linkId, suggestion);
      setSuggestion('');
      await fetchSession();
    } catch (err) {
      setError('Failed to send suggestion. Please try again.');
    } finally {
      setSending(false);
    }
  };





  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Travel Dashboard</Text>

        <PassengerCard reservation={DEMO_RESERVATION} />
            
        {DEMO_RESERVATION.flights.map((flight:any) => (
            <FlightStatusCard key={flight.id} flight={flight} />
        ))}
            
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
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
});