import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Não foi possível criar sua conta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.subtitle}>Criar conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome completo"
        placeholderTextColor="#8CA0B3"
        value={name}
        onChangeText={setName}
      />
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
        placeholder="Telefone (com DDD)"
        placeholderTextColor="#8CA0B3"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha (mínimo 8 caracteres)"
        placeholderTextColor="#8CA0B3"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar conta</Text>}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Já tem conta? Entrar
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#0B1B2B", justifyContent: "center", padding: 24 },
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
