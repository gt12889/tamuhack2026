import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface MetaBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export default function MetaBox({ label, value, highlight = false }: MetaBoxProps) {
  return (
    <View style={[styles.box, highlight && styles.boxHighlight]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  boxHighlight: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  label: {
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },
  valueHighlight: {
    color: "#4F46E5",
  },
});
