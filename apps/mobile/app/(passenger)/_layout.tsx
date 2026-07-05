import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";

export default function PassengerLayout() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#0B1B2B" }, headerTintColor: "#fff" }}>
      <Stack.Screen name="home" options={{ title: "Taxis da Região dos Lagos" }} />
      <Stack.Screen name="ride-confirm" options={{ title: "Confirmar corrida" }} />
      <Stack.Screen name="ride-tracking" options={{ title: "Sua corrida" }} />
      <Stack.Screen name="history" options={{ title: "Histórico" }} />
    </Stack>
  );
}
