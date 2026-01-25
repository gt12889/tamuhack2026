import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InfoRow from "./InfoRow";
import PreferenceChip from "./PreferenceChip";
import {Reservation} from "@/types"

interface HelperDashboardProps {
  reservation: Reservation;
}

export default function PassengerCard({reservation}:HelperDashboardProps ) {

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{reservation.passenger.first_name} {reservation.passenger.last_name}</Text>
      <Text style={styles.subtitle}>Passenger Information</Text>

      <View style={styles.highlightBox}>
        <Text style={styles.label}>CONFIRMATION CODE</Text>
        <Text style={styles.code}>{reservation.confirmation_code}</Text>
      </View>

      <InfoRow label="AAdvantage #" value={reservation.passenger.aadvantage_number} />
      <InfoRow label="Email" value={reservation.passenger.email} />
      <InfoRow label="Phone" value={reservation.passenger.phone} />

      <View style={styles.preferences}>
        <PreferenceChip text="Andriod" />
        <PreferenceChip text="English" />
      </View>
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
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    color: "#777",
    marginBottom: 12,
  },
  highlightBox: {
    backgroundColor: "#F2ECFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "#777",
  },
  code: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6B4EFF",
  },
  preferences: {
    flexDirection: "row",
    marginTop: 12,
  },
});