import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../src/services/api";
import { getSocket } from "../../src/services/socket";
import { useAuth } from "../../src/contexts/AuthContext";
import { REALTIME_EVENTS, RideStatus } from "@moveapp/shared";

interface RideDetails {
  id: string;
  status: RideStatus;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  estimatedFare: number | null;
  finalFare: number | null;
}

const STATUS_LABEL: Record<RideStatus, string> = {
  REQUESTED: "Preparando solicitação...",
  SEARCHING: "Procurando motorista próximo...",
  ACCEPTED: "Motorista a caminho",
  ARRIVED: "Motorista chegou ao local",
  IN_PROGRESS: "Em viagem",
  COMPLETED: "Corrida concluída",
  CANCELLED: "Corrida cancelada",
};

export default function RideTrackingScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [ride, setRide] = useState<RideDetails | null>(null);
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const paidRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    api.get<RideDetails>(`/rides/${rideId}`).then(({ data }) => {
      if (mounted) setRide(data);
    });

    const socket = getSocket();
    socket?.emit(REALTIME_EVENTS.RIDE_JOIN, { rideId });

    const handleStatus = (payload: { rideId: string; status: RideStatus }) => {
      if (payload.rideId !== rideId) return;
      setRide((prev) => (prev ? { ...prev, status: payload.status } : prev));
    };

    const handleDriverLocation = (payload: { rideId?: string | null; lat: number; lng: number }) => {
      if (payload.rideId !== rideId) return;
      setDriverPosition({ lat: payload.lat, lng: payload.lng });
    };

    socket?.on(REALTIME_EVENTS.RIDE_STATUS, handleStatus);
    socket?.on(REALTIME_EVENTS.RIDE_DRIVER_LOCATION, handleDriverLocation);

    return () => {
      mounted = false;
      socket?.off(REALTIME_EVENTS.RIDE_STATUS, handleStatus);
      socket?.off(REALTIME_EVENTS.RIDE_DRIVER_LOCATION, handleDriverLocation);
    };
  }, [rideId]);

  useEffect(() => {
    if (ride?.status === "COMPLETED" && !paidRef.current && user?.email) {
      paidRef.current = true;
      api.post(`/payments/rides/${rideId}/pay`, { payerEmail: user.email }).catch(() => {
        // Falha de pagamento é tratada na tela de histórico; passageiro pode tentar novamente depois.
      });
    }
  }, [ride?.status]);

  const handleCancel = async () => {
    await api.patch(`/rides/${rideId}/cancel`).catch(() => undefined);
  };

  const handleSubmitRating = async () => {
    setSubmittingRating(true);
    try {
      await api.post(`/rides/${rideId}/rating`, { score: rating });
    } finally {
      setSubmittingRating(false);
      router.replace("/(passenger)/home");
    }
  };

  if (!ride) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2E7DFF" size="large" />
      </View>
    );
  }

  if (ride.status === "CANCELLED") {
    return (
      <View style={styles.center}>
        <Text style={styles.statusText}>Corrida cancelada</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace("/(passenger)/home")}>
          <Text style={styles.primaryButtonText}>Voltar ao início</Text>
        </Pressable>
      </View>
    );
  }

  if (ride.status === "COMPLETED") {
    return (
      <View style={styles.container}>
        <Text style={styles.destination}>Corrida concluída</Text>
        <Text style={styles.fare}>R$ {(ride.finalFare ?? ride.estimatedFare ?? 0).toFixed(2)}</Text>

        <Text style={styles.sectionTitle}>Avalie o motorista</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)}>
              <Text style={[styles.star, n <= rating && styles.starSelected]}>★</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={handleSubmitRating}
          disabled={rating === 0 || submittingRating}
        >
          {submittingRating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Enviar avaliação</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: ride.originLat,
          longitude: ride.originLng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={{ latitude: ride.originLat, longitude: ride.originLng }} title="Origem" pinColor="#2E7DFF" />
        <Marker
          coordinate={{ latitude: ride.destinationLat, longitude: ride.destinationLng }}
          title="Destino"
        />
        {driverPosition && (
          <Marker
            coordinate={{ latitude: driverPosition.lat, longitude: driverPosition.lng }}
            title="Motorista"
            pinColor="#FFC542"
          />
        )}
      </MapView>

      <View style={styles.statusPanel}>
        <Text style={styles.statusText}>{STATUS_LABEL[ride.status]}</Text>
        {(ride.status === "SEARCHING" || ride.status === "ACCEPTED") && (
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar corrida</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1B2B" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B1B2B", padding: 24 },
  destination: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center", marginTop: 40 },
  fare: { color: "#2E7DFF", fontSize: 32, fontWeight: "800", textAlign: "center", marginVertical: 16 },
  sectionTitle: { color: "#8CA0B3", textAlign: "center", marginTop: 24 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 16 },
  star: { fontSize: 36, color: "#3A5064" },
  starSelected: { color: "#FFC542" },
  statusPanel: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#132A3E",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  statusText: { color: "#fff", fontSize: 17, fontWeight: "600", marginBottom: 12 },
  cancelButton: { paddingVertical: 8 },
  cancelButtonText: { color: "#FF6B6B", fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#2E7DFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
