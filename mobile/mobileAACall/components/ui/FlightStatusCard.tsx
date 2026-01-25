import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import {useState} from "react"
import MetaBox from "./MetaBox";
import Svg, { Path } from "react-native-svg";

export default function FlightStatusCard({flight}:any) {
    const [countdown, setCountdown] = useState<string>("");
    const[isUrgent, setIsUrgent] = useState(false);



    type FlightStatus =
  | "scheduled"
  | "delayed"
  | "cancelled"
  | "boarding"
  | "departed";

const getStatusConfig = (status: FlightStatus) => {
  switch (status) {
    case "scheduled":
      return {
        containerStyle: styles.greenBg,
        textStyle: styles.greenText,
        borderStyle: styles.greenBorder,
        icon: (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 13l4 4L19 7"
              stroke="#166534"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
      };

    case "delayed":
      return {
        containerStyle: styles.yellowBg,
        textStyle: styles.yellowText,
        borderStyle: styles.yellowBorder,
        icon: (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="#854d0e"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
      };

    case "cancelled":
      return {
        containerStyle: styles.redBg,
        textStyle: styles.redText,
        borderStyle: styles.redBorder,
        icon: (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 18L18 6M6 6l12 12"
              stroke="#7f1d1d"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
      };

    case "boarding":
      return {
        containerStyle: styles.blueBg,
        textStyle: styles.blueText,
        borderStyle: styles.blueBorder,
        icon: (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
              stroke="#1e40af"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ),
      };

    case "departed":
      return {
        containerStyle: styles.grayBg,
        textStyle: styles.grayText,
        borderStyle: styles.grayBorder,
        icon: (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="#374151">
            <Path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </Svg>
        ),
      };

    default:
      return {
        containerStyle: styles.grayBg,
        textStyle: styles.grayText,
        borderStyle: styles.grayBorder,
        icon: null,
      };
  }
};

  useEffect(()=>{
    const updateCountdown = () =>{
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
        setIsUrgent(hours < 1);
      } else {
        setCountdown(`${minutes}m`);
        setIsUrgent(true);
      }
    };

    



    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);





  }, [flight.departure_time])

  const statusConfig = getStatusConfig(flight.status);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.flightNumber}>{flight.flight_number}</Text>
        <View style={styles.status}>
          {statusConfig.icon}
          <Text style={styles.statusText}>{flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View>
          <Text style={styles.airport}>{flight.origin}</Text>
          <Text>8:39 PM</Text>
          <Text style={styles.date}>Sat, Jan 24</Text>
        </View>

        <View style={styles.timeline}>
          <View style={styles.line} />
          <View style={styles.dot} />
        </View>

        <View>
          <Text style={styles.airport}>ORD</Text>
          <Text>11:39 PM</Text>
          <Text style={styles.date}>Sat, Jan 24</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <MetaBox label="Gate" value={flight.gate || 'TBD'} />
        <MetaBox label="Seat" value={flight.seat || 'Not assigned'} />
      </View>

      {flight.status !== "cancelled" && flight.status !== "departed" && (
  <View
    style={[
      styles.container,
      isUrgent ? styles.urgentContainer : styles.normalContainer,
    ]}
  >
    <Text
      style={[
        styles.label,
        isUrgent ? styles.urgentLabel : styles.normalLabel,
      ]}
    >
      {flight.status === "boarding" ? "Now Boarding" : "Departs in"}
    </Text>

    <Text
      style={[
        styles.countdown,
        isUrgent ? styles.urgentCountdown : styles.normalCountdown,
      ]}
    >
      {countdown}
    </Text>

    {isUrgent && flight.status !== "boarding" && (
      <Text style={styles.urgentHint}>Time to head to the gate!</Text>
    )}
  </View>
)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  flightNumber: {
    fontSize: 18,
    fontWeight: "600",
  },
  status: {
    backgroundColor: "#E8F8EF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#2E9E5B",
  },
  route: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  airport: {
    fontSize: 18,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: "#777",
  },
  timeline: {
    flex: 1,
    alignItems: "center",
  },
  line: {
    height: 2,
    width: "80%",
    backgroundColor: "#FF4D4F",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4D4F",
    marginTop: -5,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  departBox: {
    backgroundColor: "#F2ECFF",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    alignItems: "center",
  },
  departTime: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6B4EFF",
  },
  label: {
    fontSize: 12,
    color: "#777",
  },
  greenBg: { backgroundColor: "#dcfce7" },
  greenText: { color: "#166534" },
  greenBorder: { borderColor: "#bbf7d0" },

  yellowBg: { backgroundColor: "#fef9c3" },
  yellowText: { color: "#854d0e" },
  yellowBorder: { borderColor: "#fde68a" },

  redBg: { backgroundColor: "#fee2e2" },
  redText: { color: "#7f1d1d" },
  redBorder: { borderColor: "#fecaca" },

  blueBg: { backgroundColor: "#dbeafe" },
  blueText: { color: "#1e40af" },
  blueBorder: { borderColor: "#bfdbfe" },

  grayBg: { backgroundColor: "#f3f4f6" },
  grayText: { color: "#374151" },
  grayBorder: { borderColor: "#e5e7eb" },
  container: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },

  normalContainer: {
    backgroundColor: "#f3e8ff", // purple-50
    borderWidth: 1,
    borderColor: "#e9d5ff", // purple-200
  },

  urgentContainer: {
    backgroundColor: "#fef2f2", // red-50
    borderWidth: 2,
    borderColor: "#fecaca", // red-200
  },


  normalLabel: {
    color: "#7e22ce", // purple-600
  },

  urgentLabel: {
    color: "#dc2626", // red-600
  },

  countdown: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },

  normalCountdown: {
    color: "#6b21a8", // purple-800
  },

  urgentCountdown: {
    color: "#b91c1c", // red-700
  },

  urgentHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#dc2626", // red-600
  },
})