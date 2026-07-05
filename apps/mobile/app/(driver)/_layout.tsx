import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";

export default function DriverLayout() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#0B1B2B" }, headerTintColor: "#fff" }}>
      <Stack.Screen name="home" options={{ title: "Modo motorista" }} />
      <Stack.Screen name="register" options={{ title: "Cadastro de motorista" }} />
      <Stack.Screen name="ride-navigation" options={{ title: "Corrida em andamento" }} />
      <Stack.Screen name="earnings" options={{ title: "Meus ganhos" }} />
    </Stack>
  );
}
