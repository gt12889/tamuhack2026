import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PreferenceChip({ text }: any) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#EEF1F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
  },
});