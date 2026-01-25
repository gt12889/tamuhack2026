import { Href, router } from "expo-router/build/exports";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export default function EnterCodeScreen() {
  const [code, setCode] = useState("");

  const handleEnterCode = () => {
    if (!code.trim()) {
      alert("Please enter your confirmation code");
      return;
    }

    // TODO: validate code / navigate
    const route = `/helper?code=${code}`;
    
    router.push(route as Href)
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Family Helper</Text>
        <Text style={styles.subtitle}>
          Enter your confirmation code to continue
        </Text>

        <Text style={styles.label}>CONFIRMATION CODE</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="DEMO123"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
          maxLength={8}
          returnKeyType="done"
          onSubmitEditing={handleEnterCode}
        />

        <TouchableOpacity style={styles.button} onPress={handleEnterCode}>
          <Text style={styles.buttonText}>Enter Code</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F2EEFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});