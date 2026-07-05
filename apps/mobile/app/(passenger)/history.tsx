import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { api } from "../../src/services/api";
import type { RideStatus } from "@moveapp/shared";

interface RideHistoryItem {
  id: string;
  status: RideStatus;
  destinationAddress: string;
  finalFare: number | null;
  estimatedFare: number | null;
  requestedAt: string;
}

export default function HistoryScreen() {
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<RideHistoryItem[]>("/rides/history")
      .then(({ data }) => setRides(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2E7DFF" size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      data={rides}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>Nenhuma corrida ainda.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.destination}>{item.destinationAddress}</Text>
          <View style={styles.row}>
            <Text style={styles.date}>{new Date(item.requestedAt).toLocaleString("pt-BR")}</Text>
            <Text style={styles.fare}>
              R$ {(item.finalFare ?? item.estimatedFare ?? 0).toFixed(2)}
            </Text>
          </View>
          <Text style={styles.status}>{item.status}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1B2B" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B1B2B" },
  empty: { color: "#8CA0B3", textAlign: "center", marginTop: 40 },
  card: { backgroundColor: "#132A3E", borderRadius: 12, padding: 16, marginBottom: 12 },
  destination: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  date: { color: "#8CA0B3" },
  fare: { color: "#2E7DFF", fontWeight: "700" },
  status: { color: "#8CA0B3", marginTop: 6, fontSize: 12 },
});
