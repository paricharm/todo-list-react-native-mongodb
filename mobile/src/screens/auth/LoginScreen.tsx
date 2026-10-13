
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import axios from "axios";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useAuth } from "../../context/AuthContext";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }

    try {
      setBusy(true);
      await signIn({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ||
          "Could not connect to the server. Check your Wi-Fi and backend."
        : "Something went wrong. Please try again.";

      Alert.alert("Login failed", message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>✓</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to manage your daily tasks.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#98A2B3"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#98A2B3"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            style={[styles.button, busy && styles.disabled]}
            disabled={busy}
            onPress={() => void handleLogin()}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FB" },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: { alignItems: "center", marginBottom: 30 },
  logo: {
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    textAlignVertical: "center",
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#172033" },
  subtitle: {
    fontSize: 15,
    color: "#667085",
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 20,
    elevation: 3,
  },
  label: {
    color: "#344054",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#172033",
  },
  button: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 24,
  },
  disabled: { opacity: 0.65 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 22,
  },
  footerText: { color: "#667085" },
  link: { color: "#4F46E5", fontWeight: "700" },
});