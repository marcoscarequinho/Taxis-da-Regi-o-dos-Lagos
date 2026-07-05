import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { api } from "../../src/services/api";
import { useAuth } from "../../src/contexts/AuthContext";

interface AutocompletePrediction {
  placeId: string;
  description: string;
}

export default function PassengerHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [region, setRegion] = useState<Region | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Permissão de localização negada. Ative para solicitar corridas.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setPredictions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get<AutocompletePrediction[]>("/geo/autocomplete", {
          params: { input: query },
        });
        setPredictions(data);
      } catch {
        setPredictions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  const handleSelectDestination = (prediction: AutocompletePrediction) => {
    if (!region) return;
    router.push({
      pathname: "/(passenger)/ride-confirm",
      params: {
        originLat: String(region.latitude),
        originLng: String(region.longitude),
        destinationPlaceId: prediction.placeId,
        destinationDescription: prediction.description,
      },
    });
  };

  return (
    <View style={styles.container}>
      {region ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          showsUserLocation
        >
          <Marker coordinate={region} title="Você está aqui" />
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#2E7DFF" size="large" />
          <Text style={styles.loadingText}>{locationError ?? "Obtendo sua localização..."}</Text>
        </View>
      )}

      <View style={styles.searchPanel}>
        <Text style={styles.greeting}>Olá, {user?.name?.split(" ")[0]}</Text>
        <TextInput
          style={styles.input}
          placeholder="Para onde vamos?"
          placeholderTextColor="#8CA0B3"
          value={query}
          onChangeText={setQuery}
        />
        {searching && <ActivityIndicator style={{ marginTop: 8 }} color="#2E7DFF" />}
        {predictions.length > 0 && (
          <FlatList
            style={styles.predictions}
            data={predictions}
            keyExtractor={(item) => item.placeId}
            renderItem={({ item }) => (
              <Pressable style={styles.predictionItem} onPress={() => handleSelectDestination(item)}>
                <Text style={styles.predictionText}>{item.description}</Text>
              </Pressable>
            )}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => router.push("/(passenger)/history")}>
          <Text style={styles.footerLink}>Histórico</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(driver)/home")}>
          <Text style={styles.footerLink}>Modo motorista</Text>
        </Pressable>
        <Pressable onPress={logout}>
          <Text style={styles.footerLink}>Sair</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1B2B" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#8CA0B3", marginTop: 12, textAlign: "center", paddingHorizontal: 24 },
  searchPanel: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "#132A3E",
    borderRadius: 16,
    padding: 16,
  },
  greeting: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: "#0B1B2B",
    color: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  predictions: { maxHeight: 220, marginTop: 8 },
  predictionItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1E3A52" },
  predictionText: { color: "#fff" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLink: { color: "#2E7DFF", fontWeight: "600" },
});
