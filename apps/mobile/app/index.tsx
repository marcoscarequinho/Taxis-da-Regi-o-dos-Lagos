import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/contexts/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B1B2B" }}>
        <ActivityIndicator color="#ffffff" size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(passenger)/home" />;
}
