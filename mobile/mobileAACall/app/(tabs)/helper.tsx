import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, StyleSheet, View, ActivityIndicator } from "react-native";
import PassengerCard from "@/components/ui/PassengerCard";
import FlightStatusCard from "@/components/ui/FlightStatusCard";
import type {Message,Reservation} from "@/types";
import { getHelperSession, sendHelperSuggestion } from '@/lib/api';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@react-navigation/elements";




// Demo reservation: PIT -> DFW, Monday January 19, 2026
const DEMO_RESERVATION: Reservation = {
  id: 'demo-res-001',
  confirmation_code: 'CZYBYU',
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
      departure_time: '2026-01-19T07:06:00-05:00', // 7:06 AM EST
      arrival_time: '2026-01-19T09:50:00-06:00', // 9:50 AM CST
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
  const code = params.code as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const data = await getHelperSession(code);
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
  }, [code]);

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
      await sendHelperSuggestion(code, suggestion);
      setSuggestion('');
      await fetchSession();
    } catch (err) {
      setError('Failed to send suggestion. Please try again.');
    } finally {
      setSending(false);
    }
  };

   if ( loading && reservation != null){
      return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Travel Dashboard</Text>

        <PassengerCard reservation={reservation} />
            
        {reservation?.flights.map((flight:any) => (
            <FlightStatusCard key={flight.id} flight={flight} />
        ))}
            
      </ScrollView>
    </SafeAreaView>
  );
  }
else{
  

if(!error){
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

  return(
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.screen}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003087" />
        <Text style={styles.text}>Loading session...</Text>
      </View>
    </View>
    
        
            
      </ScrollView>
    </SafeAreaView>
  )

}
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
  },header2: {
  fontSize: 28,
  fontWeight: "800",
  letterSpacing: 0.3,
  color: "#111827",
  marginBottom: 12,
  textAlign: "center",
},
errorBox: {
  backgroundColor: "#FEE2E2", // soft red background
  borderColor: "#FCA5A5",
  borderWidth: 1,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  marginBottom: 20,
},

errorText: {
  color: "#B91C1C", // deep red text
  fontSize: 16,
  fontWeight: "600",
  textAlign: "center",
}, screen: {
    flex: 1, // min-h-screen
    backgroundColor: "#f9fafb", // gray-50
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
  },
  text: {
    marginTop: 16,
    fontSize: 16, // text-body-lg equivalent
    color: "#4b5563", // gray-600
  },
});