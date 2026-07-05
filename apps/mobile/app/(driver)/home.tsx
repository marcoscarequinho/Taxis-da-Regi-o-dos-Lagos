import { useEffect, useRef, useState } from "react";
import { View, Text, Switch, Pressable, StyleSheet, ActivityIndicator, Modal } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { api } from "../../src/services/api";
import { getSocket } from "../../src/services/socket";
import { useAuth } from "../../src/contexts/AuthContext";
import { DRIVER_LOCATION_UPDATE_INTERVAL_MS } from "../../src/config";
import { REALTIME_EVENTS, RideOfferEvent } from "@moveapp/shared";

export default function DriverHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [region, setRegion] = useState<Location.LocationObjectCoords | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [offer, setOffer] = useState<RideOfferEvent | null>(null);
  const [countdown, setCountdown] = useState(0);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const ackRef = useRef<((response: { accepted: boolean }) => void) | null>(null);

  useEffect(() => {
    if (!user?.isDriver) return;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({});
        setRegion(position.coords);
      }
    })();

    const socket = getSocket();
    const handleOffer = (payload: RideOfferEvent, ack: (response: { accepted: boolean }) => void) => {
      setOffer(payload);
      ackRef.current = ack;
      setCountdown(Math.max(0, Math.round((new Date(payload.offerExpiresAt).getTime() - Date.now()) / 1000)));
    };
    socket?.on(REALTIME_EVENTS.RIDE_OFFER, handleOffer);

    return () => {
      socket?.off(REALTIME_EVENTS.RIDE_OFFER, handleOffer);
      watchSubscription.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!offer || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    if (countdown === 1) {
      setTimeout(() => respondToOffer(false), 1000);
    }
    return () => clearTimeout(timer);
  }, [offer, countdown]);

  const respondToOffer = (accepted: boolean) => {
    ackRef.current?.({ accepted });
    ackRef.current = null;
    const acceptedOffer = offer;
    setOffer(null);
    if (accepted && acceptedOffer) {
      router.push({ pathname: "/(driver)/ride-navigation", params: { rideId: acceptedOffer.rideId } });
    }
  };

  const startWatchingPosition = async () => {
    watchSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: DRIVER_LOCATION_UPDATE_INTERVAL_MS, distanceInterval: 20 },
      (position) => {
        setRegion(position.coords);
        getSocket()?.emit(REALTIME_EVENTS.DRIVER_LOCATION, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date().toISOString(),
        });
      },
    );
  };

  const toggleOnline = async (value: boolean) => {
    setToggling(true);
    try {
      const position = await Location.getCurrentPositionAsync({});
      await api.patch("/drivers/status", {
        isOnline: value,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setIsOnline(value);
      if (value) {
        await startWatchingPosition();
      } else {
        watchSubscription.current?.remove();
        watchSubscription.current = null;
      }
    } finally {
      setToggling(false);
    }
  };

  if (!user?.isDriver) {
    return (
      <View style={styles.center}>
        <Text style={styles.ctaText}>Cadastre-se como motorista para começar a receber corridas.</Text>
        <Pressable style={styles.ctaButton} onPress={() => router.push("/(driver)/register")}>
          <Text style={styles.ctaButtonText}>Cadastrar como motorista</Text>
        </Pressable>
      </View>
    );
  }

  if (!user.driverProfile?.mpConnected) {
    return (
      <View style={styles.center}>
        <Text style={styles.ctaText}>
          Conecte sua conta Mercado Pago para receber via Pix os 80% de cada corrida antes de ficar online.
        </Text>
        <Pressable style={styles.ctaButton} onPress={() => router.push("/(driver)/register")}>
          <Text style={styles.ctaButtonText}>Conectar Mercado Pago</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {region ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#2E7DFF" size="large" />
        </View>
      )}

      <View style={styles.topPanel}>
        <Text style={styles.greeting}>{user?.name}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{isOnline ? "Online" : "Offline"}</Text>
          {toggling ? (
            <ActivityIndicator color="#2E7DFF" />
          ) : (
            <Switch value={isOnline} onValueChange={toggleOnline} />
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => router.push("/(driver)/earnings")}>
          <Text style={styles.footerLink}>Meus ganhos</Text>
        </Pressable>
        <Pressable onPress={logout}>
          <Text style={styles.footerLink}>Sair</Text>
        </Pressable>
      </View>

      <Modal visible={!!offer} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova corrida ({countdown}s)</Text>
            <Text style={styles.modalText}>Passageiro: {offer?.passengerName}</Text>
            <Text style={styles.modalText}>Origem: {offer?.origin.address}</Text>
            <Text style={styles.modalText}>Destino: {offer?.destination.address}</Text>
            <Text style={styles.modalFare}>R$ {offer?.estimatedFare.toFixed(2)}</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.rejectButton} onPress={() => respondToOffer(false)}>
                <Text style={styles.rejectButtonText}>Recusar</Text>
              </Pressable>
              <Pressable style={styles.acceptButton} onPress={() => respondToOffer(true)}>
                <Text style={styles.acceptButtonText}>Aceitar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1B2B" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B1B2B", padding: 24 },
  ctaText: { color: "#8CA0B3", textAlign: "center", marginBottom: 20, fontSize: 16 },
  ctaButton: { backgroundColor: "#2E7DFF", borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24 },
  ctaButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  topPanel: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "#132A3E",
    borderRadius: 16,
    padding: 16,
  },
  greeting: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusLabel: { color: "#8CA0B3", fontSize: 15 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLink: { color: "#2E7DFF", fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#132A3E", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  modalText: { color: "#8CA0B3", marginBottom: 4 },
  modalFare: { color: "#2E7DFF", fontSize: 24, fontWeight: "800", marginVertical: 12 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  rejectButton: { flex: 1, backgroundColor: "#1E3A52", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  rejectButtonText: { color: "#FF6B6B", fontWeight: "700" },
  acceptButton: { flex: 1, backgroundColor: "#2E7DFF", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  acceptButtonText: { color: "#fff", fontWeight: "700" },
});
