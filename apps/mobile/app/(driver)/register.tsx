import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { api } from "../../src/services/api";
import { useAuth } from "../../src/contexts/AuthContext";

export default function DriverRegisterScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<"form" | "mercadopago">(user?.isDriver ? "mercadopago" : "form");
  const [cnhNumber, setCnhNumber] = useState("");
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/drivers/documents", {
        cnhNumber: cnhNumber.trim(),
        cnhDocUrl: "https://placeholder.local/cnh.jpg",
      });
      await api.post("/vehicles", {
        plate: plate.trim().toUpperCase(),
        model: model.trim(),
        color: color.trim(),
        year: Number(year),
      });
      await refreshUser();
      setStep("mercadopago");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Não foi possível concluir o cadastro.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectMercadoPago = async () => {
    setConnecting(true);
    try {
      const { data } = await api.get<{ url: string }>("/drivers/mercadopago/connect-url");
      await WebBrowser.openBrowserAsync(data.url);
    } finally {
      setConnecting(false);
    }
  };

  const handleCheckConnection = async () => {
    setCheckingConnection(true);
    try {
      await refreshUser();
      router.replace("/(driver)/home");
    } finally {
      setCheckingConnection(false);
    }
  };

  if (step === "mercadopago") {
    return (
      <View style={styles.center}>
        <Text style={styles.sectionTitle}>Último passo</Text>
        <Text style={styles.ctaText}>
          Conecte sua conta Mercado Pago para receber automaticamente 80% de cada corrida via Pix, assim que o
          passageiro pagar.
        </Text>

        <Pressable style={styles.button} onPress={handleConnectMercadoPago} disabled={connecting}>
          {connecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Conectar Mercado Pago</Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleCheckConnection} disabled={checkingConnection}>
          {checkingConnection ? (
            <ActivityIndicator color="#2E7DFF" />
          ) : (
            <Text style={styles.secondaryButtonText}>Já conectei, continuar</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Documentos</Text>
      <TextInput
        style={styles.input}
        placeholder="Número da CNH"
        placeholderTextColor="#8CA0B3"
        value={cnhNumber}
        onChangeText={setCnhNumber}
      />

      <Text style={styles.sectionTitle}>Veículo</Text>
      <TextInput
        style={styles.input}
        placeholder="Placa"
        placeholderTextColor="#8CA0B3"
        autoCapitalize="characters"
        value={plate}
        onChangeText={setPlate}
      />
      <TextInput
        style={styles.input}
        placeholder="Modelo"
        placeholderTextColor="#8CA0B3"
        value={model}
        onChangeText={setModel}
      />
      <TextInput
        style={styles.input}
        placeholder="Cor"
        placeholderTextColor="#8CA0B3"
        value={color}
        onChangeText={setColor}
      />
      <TextInput
        style={styles.input}
        placeholder="Ano"
        placeholderTextColor="#8CA0B3"
        keyboardType="number-pad"
        value={year}
        onChangeText={setYear}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continuar</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#0B1B2B", padding: 24 },
  center: { flex: 1, backgroundColor: "#0B1B2B", padding: 24, justifyContent: "center" },
  sectionTitle: { color: "#8CA0B3", marginTop: 8, marginBottom: 8 },
  ctaText: { color: "#fff", fontSize: 16, marginBottom: 24, lineHeight: 22 },
  input: {
    backgroundColor: "#132A3E",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: { backgroundColor: "#2E7DFF", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 12 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryButton: { paddingVertical: 16, alignItems: "center", marginTop: 8 },
  secondaryButtonText: { color: "#2E7DFF", fontSize: 15, fontWeight: "600" },
  error: { color: "#FF6B6B", marginBottom: 8, textAlign: "center" },
});
