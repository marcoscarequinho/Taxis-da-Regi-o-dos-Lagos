import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { APP_NAME } from "../../src/config";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Não foi possível entrar. Verifique seus dados.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Entrar</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#8CA0B3"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#8CA0B3"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        Não tem conta? Cadastre-se
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1B2B", justifyContent: "center", padding: 24 },
  title: { color: "#fff", fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  subtitle: { color: "#8CA0B3", fontSize: 16, textAlign: "center", marginBottom: 32 },
  input: {
    backgroundColor: "#132A3E",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2E7DFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#FF6B6B", marginBottom: 8, textAlign: "center" },
  link: { color: "#2E7DFF", textAlign: "center", marginTop: 20 },
});
