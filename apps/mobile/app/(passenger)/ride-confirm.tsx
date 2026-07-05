import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../src/services/api";

interface EstimateResponse {
  distanceKm: number;
  durationMin: number;
  estimatedFare: number;
  destination: { address: string };
}

export default function RideConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    originLat: string;
    originLng: string;
    destinationPlaceId: string;
    destinationDescription: string;
  }>();

  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const originPayload = {
    lat: Number(params.originLat),
    lng: Number(params.originLng),
  };
  const destinationPayload = { placeId: params.destinationPlaceId };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post<EstimateResponse>("/rides/estimate", {
          origin: originPayload,
          destination: destinationPayload,
        });
        setEstimate(data);
      } catch {
        setError("Não foi possível calcular a rota. Tente novamente.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConfirm = async () => {
    setRequesting(true);
    setError(null);
    try {
      const { data } = await api.post("/rides", {
        origin: originPayload,
        destination: destinationPayload,
      });
      router.replace({ pathname: "/(passenger)/ride-tracking", params: { rideId: data.id } });
    } catch {
      setError("Não foi possível solicitar a corrida. Tente novamente.");
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2E7DFF" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.destination}>{params.destinationDescription}</Text>

      {estimate && (
        <View style={styles.card}>
          <Row label="Distância" value={`${estimate.distanceKm.toFixed(1)} km`} />
          <Row label="Tempo estimado" value={`${Math.round(estimate.durationMin)} min`} />
          <Row label="Valor estimado" value={`R$ ${estimate.estimatedFare.toFixed(2)}`} highlight />
        </View>
      )}

      <View style={styles.paymentBadge}>
        <Text style={styles.paymentBadgeText}>Pagamento via Pix</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.confirmButton} onPress={handleConfirm} disabled={requesting}>
        {requesting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar corrida</Text>
        )}
      </Pressable>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1B2B", padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B1B2B" },
  destination: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 16 },
  card: { backgroundColor: "#132A3E", borderRadius: 16, padding: 16, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLabel: { color: "#8CA0B3" },
  rowValue: { color: "#fff", fontWeight: "600" },
  rowValueHighlight: { color: "#2E7DFF", fontSize: 18 },
  paymentBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#132A3E",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 24,
  },
  paymentBadgeText: { color: "#2E7DFF", fontWeight: "600" },
  error: { color: "#FF6B6B", marginBottom: 12, textAlign: "center" },
  confirmButton: { backgroundColor: "#2E7DFF", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
