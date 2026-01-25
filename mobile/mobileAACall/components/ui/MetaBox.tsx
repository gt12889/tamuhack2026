import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MetaBox({ label, value }: any) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#F6F7FB",
    borderRadius: 12,
    padding: 12,
    width: "48%",
  },
  label: {
    fontSize: 12,
    color: "#777",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});