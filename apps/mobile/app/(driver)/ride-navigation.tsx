import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Linking } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "../../src/services/api";
import { getSocket } from "../../src/services/socket";
import { DRIVER_LOCATION_UPDATE_INTERVAL_MS } from "../../src/config";
import { REALTIME_EVENTS, RideStatus } from "@moveapp/shared";

interface RideDetails {
  id: string;
  status: RideStatus;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  finalFare: number | null;
  estimatedFare: number | null;
}

export default function DriverRideNavigationScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const router = useRouter();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [updating, setUpdating] = useState(false);
  const [rating, setRating] = useState(0);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    api.get<RideDetails>(`/rides/${rideId}`).then(({ data }) => setRide(data));

    const socket = getSocket();
    socket?.emit(REALTIME_EVENTS.RIDE_JOIN, { rideId });

    (async () => {
      watchSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: DRIVER_LOCATION_UPDATE_INTERVAL_MS, distanceInterval: 15 },
        (position) => {
          socket?.emit(REALTIME_EVENTS.DRIVER_LOCATION, {
            rideId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date().toISOString(),
          });
        },
      );
    })();

    return () => {
      watchSubscription.current?.remove();
    };
  }, [rideId]);

  const advanceStatus = async (action: "arrived" | "start" | "complete") => {
    setUpdating(true);
    try {
      const { data } = await api.patch<RideDetails>(`/rides/${rideId}/${action}`);
      setRide(data);
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitRatingAndFinish = async () => {
    try {
      await api.post(`/rides/${rideId}/rating`, { score: rating });
    } finally {
      router.replace("/(driver)/home");
    }
  };

  const openExternalNavigation = () => {
    if (!ride) return;
    const target =
      ride.status === "ACCEPTED"
        ? { lat: ride.originLat, lng: ride.originLng }
        : { lat: ride.destinationLat, lng: ride.destinationLng };
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`);
  };

  if (!ride) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2E7DFF" size="large" />
      </View>
    );
  }

  if (ride.status === "COMPLETED") {
    return (
      <View style={styles.container}>
        <Text style={styles.destination}>Corrida concluída</Text>
        <Text style={styles.fare}>R$ {(ride.finalFare ?? ride.estimatedFare ?? 0).toFixed(2)}</Text>

        <Text style={styles.sectionTitle}>Avalie o passageiro</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)}>
              <Text style={[styles.star, n <= rating && styles.starSelected]}>★</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={handleSubmitRatingAndFinish} disabled={rating === 0}>
          <Text style={styles.primaryButtonText}>Enviar avaliação</Text>
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
        <Marker coordinate={{ latitude: ride.destinationLat, longitude: ride.destinationLng }} title="Destino" />
      </MapView>

      <View style={styles.bottomPanel}>
        <Text style={styles.statusText}>{ride.destinationAddress}</Text>

        <Pressable style={styles.secondaryButton} onPress={openExternalNavigation}>
          <Text style={styles.secondaryButtonText}>Abrir no Google Maps</Text>
        </Pressable>

        {ride.status === "ACCEPTED" && (
          <ActionButton label="Cheguei ao local" loading={updating} onPress={() => advanceStatus("arrived")} />
        )}
        {ride.status === "ARRIVED" && (
          <ActionButton label="Iniciar corrida" loading={updating} onPress={() => advanceStatus("start")} />
        )}
        {ride.status === "IN_PROGRESS" && (
          <ActionButton label="Finalizar corrida" loading={updating} onPress={() => advanceStatus("complete")} />
        )}
      </View>
    </View>
  );
}

function ActionButton({ label, loading, onPress }: { label: string; loading: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.primaryButton} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{label}</Text>}
    </Pressable>
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
  bottomPanel: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "#132A3E",
    borderRadius: 16,
    padding: 20,
  },
  statusText: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  secondaryButton: {
    backgroundColor: "#1E3A52",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButtonText: { color: "#fff", fontWeight: "600" },
  primaryButton: { backgroundColor: "#2E7DFF", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
