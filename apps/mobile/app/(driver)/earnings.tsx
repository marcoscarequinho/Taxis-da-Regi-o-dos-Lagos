import { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { api } from "../../src/services/api";

interface EarningsResponse {
  totals: { gross: number; commission: number; net: number };
  rides: { rideId: string; completedAt: string; gross: number; commission: number; net: number }[];
}

export default function DriverEarningsScreen() {
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<EarningsResponse>("/drivers/me/earnings")
      .then(({ data }) => setEarnings(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !earnings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2E7DFF" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <SummaryRow label="Total bruto" value={earnings.totals.gross} />
        <SummaryRow label="Comissão da plataforma" value={-earnings.totals.commission} />
        <SummaryRow label="Total líquido" value={earnings.totals.net} highlight />
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={earnings.rides}
        keyExtractor={(item) => item.rideId}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma corrida concluída ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.rideRow}>
            <Text style={styles.rideDate}>{new Date(item.completedAt).toLocaleString("pt-BR")}</Text>
            <Text style={styles.rideNet}>R$ {item.net.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>
        R$ {value.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1B2B" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B1B2B" },
  empty: { color: "#8CA0B3", textAlign: "center", marginTop: 40 },
  summaryCard: { backgroundColor: "#132A3E", borderRadius: 16, padding: 20, margin: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryLabel: { color: "#8CA0B3" },
  summaryValue: { color: "#fff", fontWeight: "600" },
  summaryValueHighlight: { color: "#2E7DFF", fontSize: 18 },
  rideRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#132A3E",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rideDate: { color: "#8CA0B3" },
  rideNet: { color: "#2E7DFF", fontWeight: "700" },
});
