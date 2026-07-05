import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Redirect href="/(passenger)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
