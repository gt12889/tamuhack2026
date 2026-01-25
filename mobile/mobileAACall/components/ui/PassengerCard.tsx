import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InfoRow from "./InfoRow";
import PreferenceChip from "./PreferenceChip";

export default function PassengerCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Margaret Johnson</Text>
      <Text style={styles.subtitle}>Passenger Information</Text>

      <View style={styles.highlightBox}>
        <Text style={styles.label}>CONFIRMATION CODE</Text>
        <Text style={styles.code}>DEMO123</Text>
      </View>

      <InfoRow label="AAdvantage #" value="1234567890" />
      <InfoRow label="Email" value="margaret.johnson@email.com" />
      <InfoRow label="Phone" value="(555) 123-4567" />

      <View style={styles.preferences}>
        <PreferenceChip text="Window" />
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