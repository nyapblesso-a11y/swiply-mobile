import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert(
        "Login failed",
        err.response?.data?.message ?? "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swiply</Text>
      <Text style={styles.subtitle}>Welcome back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#5C6570"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#5C6570"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="#5C6570"
          />
        </Pressable>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FAF9F6" />
        ) : (
          <Text style={styles.primaryButtonText}>Log In</Text>
        )}
      </Pressable>

      <View style={styles.socialRow}>
        <Pressable
          style={styles.socialButton}
          disabled
          onPress={() => Alert.alert("Coming soon")}
        >
          <Text style={styles.socialButtonText}>Google</Text>
        </Pressable>
        <Pressable
          style={styles.socialButton}
          disabled
          onPress={() => Alert.alert("Coming soon")}
        >
          <Text style={styles.socialButtonText}>LinkedIn</Text>
        </Pressable>
      </View>

      <Link href="/(auth)/register" style={styles.link}>
        Don't have an account? <Text style={styles.linkBold}>Register</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#1F2A37",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#5C6570",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E2DA",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 15,
    color: "#1F2A37",
    backgroundColor: "#FFFFFF",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E2DA",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1F2A37",
  },
  eyeIcon: {
    padding: 14,
  },
  primaryButton: {
    backgroundColor: "#2F7864",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: { color: "#FAF9F6", fontSize: 16, fontWeight: "600" },
  socialRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E2DA",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    opacity: 0.5,
  },
  socialButtonText: { color: "#5C6570", fontSize: 14 },
  link: { textAlign: "center", color: "#5C6570", marginTop: 24, fontSize: 13 },
  linkBold: { color: "#2F7864", fontWeight: "600" },
});
