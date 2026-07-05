import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { clearTokens, getAccessToken, saveTokens } from "../services/storage";
import { connectSocket, disconnectSocket } from "../services/socket";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isDriver: boolean;
  isPassenger: boolean;
  driverProfile?: { isOnline: boolean; ratingAvg: number; mpConnected: boolean } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string; isDriver?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = async () => {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get<AuthUser>("/users/me");
      setUser(data);
      connectSocket(token);
    } catch {
      await clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    await saveTokens(data.accessToken, data.refreshToken);
    await loadCurrentUser();
  };

  const register = async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    isDriver?: boolean;
  }) => {
    const { data } = await api.post("/auth/register", payload);
    await saveTokens(data.accessToken, data.refreshToken);
    await loadCurrentUser();
  };

  const logout = async () => {
    disconnectSocket();
    await clearTokens();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser: loadCurrentUser }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return ctx;
}
