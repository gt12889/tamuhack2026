import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Reservation } from "@/types";
import Svg, { Path, Circle } from "react-native-svg";

interface PassengerCardProps {
  reservation: Reservation;
}

export default function PassengerCard({ reservation }: PassengerCardProps) {
  const passenger = reservation.passenger;
  const initials = `${passenger.first_name[0]}${passenger.last_name[0]}`;

  return (
    <View style={styles.card}>
      {/* Header with Avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{passenger.first_name} {passenger.last_name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="#059669">
                <Path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#059669" strokeWidth={2} fill="none" />
              </Svg>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
            <View style={styles.loyaltyBadge}>
              <Text style={styles.loyaltyText}>AAdvantage</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#6B7280" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{passenger.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" stroke="#6B7280" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{passenger.phone}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoIcon}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" stroke="#6B7280" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>AAdvantage #</Text>
            <Text style={styles.infoValue}>{passenger.aadvantage_number || 'Not enrolled'}</Text>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.preferencesSection}>
        <Text style={styles.preferencesLabel}>Preferences</Text>
        <View style={styles.preferencesRow}>
          <View style={styles.preferenceChip}>
            <Text style={styles.preferenceIcon}>🪟</Text>
            <Text style={styles.preferenceText}>Window Seat</Text>
          </View>
          <View style={styles.preferenceChip}>
            <Text style={styles.preferenceIcon}>🇺🇸</Text>
            <Text style={styles.preferenceText}>English</Text>
          </View>
          <View style={styles.preferenceChip}>
            <Text style={styles.preferenceIcon}>♿</Text>
            <Text style={styles.preferenceText}>Assistance</Text>
          </View>
        </View>
      </View>
    </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  headerInfo: {
    marginLeft: 14,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  loyaltyBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loyaltyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4F46E5",
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginTop: 2,
  },
  preferencesSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  preferencesLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  preferencesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  preferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  preferenceIcon: {
    fontSize: 14,
  },
  preferenceText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
});
