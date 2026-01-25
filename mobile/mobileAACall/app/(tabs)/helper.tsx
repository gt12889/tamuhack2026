import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";

export default function TravelDashboard() {








    
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Family Helper</Text>

        {/* Passenger Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Margaret Johnson</Text>
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

        {/* Flight Card */}
        <View style={styles.card}>
          <View style={styles.flightHeader}>
            <Text style={styles.flightNumber}>AA1234</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Scheduled</Text>
            </View>
          </View>

          <View style={styles.route}>
            <View>
              <Text style={styles.airport}>DFW</Text>
              <Text style={styles.time}>8:39 PM</Text>
              <Text style={styles.date}>Sat, Jan 24</Text>
            </View>

            <View style={styles.timeline}>
              <View style={styles.line} />
              <View style={styles.planeDot} />
            </View>

            <View>
              <Text style={styles.airport}>ORD</Text>
              <Text style={styles.time}>11:39 PM</Text>
              <Text style={styles.date}>Sat, Jan 24</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <MetaBox label="Gate" value="B22" />
            <MetaBox label="Seat" value="14A" />
          </View>

          <View style={styles.departBox}>
            <Text style={styles.label}>DEPARTS IN</Text>
            <Text style={styles.departTime}>1h 59m</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Small Components ---------- */

const InfoRow = ({ label, value }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const PreferenceChip = ({ text }: any) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{text}</Text>
  </View>
);

const MetaBox = ({ label, value }: any) => (
  <View style={styles.metaBox}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

/* ---------- Styles ---------- */

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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
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
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#888",
  },
  infoValue: {
    fontSize: 14,
  },
  preferences: {
    flexDirection: "row",
    marginTop: 12,
  },
  chip: {
    backgroundColor: "#EEF1F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
  },
  flightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flightNumber: {
    fontSize: 18,
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: "#E8F8EF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#2E9E5B",
    fontSize: 12,
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
  time: {
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: "#777",
  },
  timeline: {
    alignItems: "center",
    flex: 1,
  },
  line: {
    height: 2,
    width: "80%",
    backgroundColor: "#FF4D4F",
  },
  planeDot: {
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
  metaBox: {
    backgroundColor: "#F6F7FB",
    padding: 12,
    borderRadius: 12,
    width: "48%",
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "600",
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
});
