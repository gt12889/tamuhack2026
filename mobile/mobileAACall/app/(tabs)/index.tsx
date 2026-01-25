import { Href, router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from "react-native";
import Svg, { Path } from "react-native-svg";

export default function EnterCodeScreen() {
  const [code, setCode] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleEnterCode = () => {
    if (!code.trim()) {
      return;
    }
    const route = `/helper?code=${code.toUpperCase()}`;
    router.push(route as Href);
  };

  const handleDemoCode = (demoCode: string) => {
    setCode(demoCode);
    setTimeout(() => {
      router.push(`/helper?code=${demoCode}` as Href);
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Logo / Brand */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>👵</Text>
          </View>
          <Text style={styles.brandName}>MeeMaw</Text>
          <Text style={styles.tagline}>AI Travel Companion</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome, Family Helper</Text>
          <Text style={styles.subtitle}>
            Enter your loved one's confirmation code to help them navigate their journey.
          </Text>

          {/* Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>CONFIRMATION CODE</Text>
            <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.inputIcon}>
                <Path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" stroke={isFocused ? "#6C63FF" : "#9CA3AF"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <TextInput
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                placeholder="MEEMAW"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
                maxLength={8}
                returnKeyType="go"
                onSubmitEditing={handleEnterCode}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>
          </View>

          {/* Primary Button */}
          <TouchableOpacity
            style={[styles.button, !code.trim() && styles.buttonDisabled]}
            onPress={handleEnterCode}
            disabled={!code.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M13 7l5 5m0 0l-5 5m5-5H6" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          {/* Demo Codes */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>Quick Demo Codes</Text>
            <View style={styles.demoButtons}>
              {["MEEMAW", "GRANNY", "PAPA44"].map((demoCode) => (
                <TouchableOpacity
                  key={demoCode}
                  style={styles.demoButton}
                  onPress={() => handleDemoCode(demoCode)}
                >
                  <Text style={styles.demoButtonText}>{demoCode}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.footerText}>Secure & Private</Text>
          </View>
          <View style={styles.footerDot} />
          <View style={styles.footerItem}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.footerText}>Real-time Updates</Text>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6C63FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 40,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: "#6C63FF",
    backgroundColor: "#FAFAFF",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: 2,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: "#6C63FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  demoSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  demoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  demoButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    gap: 16,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
});
