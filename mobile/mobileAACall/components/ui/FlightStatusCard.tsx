import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import MetaBox from "./MetaBox";
import Svg, { Path, Circle } from "react-native-svg";

interface FlightProps {
  id: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  gate?: string;
  seat?: string;
  status: string;
}

export default function FlightStatusCard({ flight }: { flight: FlightProps }) {
  const [countdown, setCountdown] = useState<string>("--");
  const [isUrgent, setIsUrgent] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  type FlightStatus = "scheduled" | "delayed" | "cancelled" | "boarding" | "departed";

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusConfig = (status: FlightStatus) => {
    switch (status) {
      case "scheduled":
        return {
          bg: "#ECFDF5",
          text: "#059669",
          label: "On Time",
          icon: (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ),
        };
      case "delayed":
        return {
          bg: "#FEF3C7",
          text: "#D97706",
          label: "Delayed",
          icon: (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="9" stroke="#D97706" strokeWidth={2} />
              <Path d="M12 7v5l3 3" stroke="#D97706" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          ),
        };
      case "cancelled":
        return {
          bg: "#FEE2E2",
          text: "#DC2626",
          label: "Cancelled",
          icon: (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M6 18L18 6M6 6l12 12" stroke="#DC2626" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          ),
        };
      case "boarding":
        return {
          bg: "#DBEAFE",
          text: "#2563EB",
          label: "Boarding",
          icon: (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M13 5l7 7-7 7M5 5l7 7-7 7" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ),
        };
      case "departed":
        return {
          bg: "#F3F4F6",
          text: "#6B7280",
          label: "Departed",
          icon: (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="#6B7280">
              <Path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </Svg>
          ),
        };
      default:
        return { bg: "#F3F4F6", text: "#6B7280", label: status, icon: null };
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const departure = new Date(flight.departure_time);
      const diff = departure.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Departed');
        setIsUrgent(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setCountdown(`${days}d ${hours % 24}h`);
        setIsUrgent(false);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m`);
        setIsUrgent(hours < 2);
      } else {
        setCountdown(`${minutes}m`);
        setIsUrgent(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [flight.departure_time]);

  // Pulse animation for urgent status
  useEffect(() => {
    if (isUrgent) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isUrgent, pulseAnim]);

  const statusConfig = getStatusConfig(flight.status as FlightStatus);

  return (
    <Animated.View style={[styles.card, isUrgent && styles.urgentCard, { transform: [{ scale: pulseAnim }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.flightInfo}>
          <Text style={styles.flightNumber}>{flight.flight_number}</Text>
          <Text style={styles.airline}>American Airlines</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          {statusConfig.icon}
          <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.route}>
        <View style={styles.routePoint}>
          <Text style={styles.airportCode}>{flight.origin}</Text>
          <Text style={styles.time}>{formatTime(flight.departure_time)}</Text>
          <Text style={styles.date}>{formatDate(flight.departure_time)}</Text>
        </View>

        <View style={styles.routeLine}>
          <View style={styles.lineContainer}>
            <View style={styles.dotStart} />
            <View style={styles.line} />
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="#6C63FF" style={styles.planeIcon}>
              <Path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </Svg>
            <View style={styles.line} />
            <View style={styles.dotEnd} />
          </View>
          <Text style={styles.duration}>Direct</Text>
        </View>

        <View style={styles.routePoint}>
          <Text style={styles.airportCode}>{flight.destination}</Text>
          <Text style={styles.time}>{formatTime(flight.arrival_time)}</Text>
          <Text style={styles.date}>{formatDate(flight.arrival_time)}</Text>
        </View>
      </View>

      {/* Gate & Seat */}
      <View style={styles.metaRow}>
        <MetaBox label="Gate" value={flight.gate || 'TBD'} highlight={!!flight.gate} />
        <MetaBox label="Seat" value={flight.seat || 'Not assigned'} highlight={!!flight.seat} />
      </View>

      {/* Countdown */}
      {flight.status !== "cancelled" && flight.status !== "departed" && (
        <View style={[styles.countdownBox, isUrgent ? styles.urgentBox : styles.normalBox]}>
          <Text style={[styles.countdownLabel, isUrgent ? styles.urgentText : styles.normalText]}>
            {flight.status === "boarding" ? "🚨 Now Boarding" : "⏱️ Departs in"}
          </Text>
          <Text style={[styles.countdownValue, isUrgent ? styles.urgentValue : styles.normalValue]}>
            {countdown}
          </Text>
          {isUrgent && flight.status !== "boarding" && (
            <Text style={styles.urgentHint}>Head to gate now!</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  urgentCard: {
    borderWidth: 2,
    borderColor: "#FCA5A5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  flightInfo: {
    flex: 1,
  },
  flightNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  airline: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  route: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  routePoint: {
    alignItems: "center",
    width: 70,
  },
  airportCode: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  time: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  routeLine: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  lineContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  dotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6C63FF",
  },
  dotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6C63FF",
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
  },
  planeIcon: {
    marginHorizontal: 4,
    transform: [{ rotate: "90deg" }],
  },
  duration: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  countdownBox: {
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  normalBox: {
    backgroundColor: "#F3E8FF",
  },
  urgentBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  normalText: {
    color: "#7C3AED",
  },
  urgentText: {
    color: "#DC2626",
  },
  countdownValue: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  normalValue: {
    color: "#5B21B6",
  },
  urgentValue: {
    color: "#B91C1C",
  },
  urgentHint: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
    fontWeight: "500",
  },
});
