import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function InfoRow({ label, value }: any) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#888",
  },
});