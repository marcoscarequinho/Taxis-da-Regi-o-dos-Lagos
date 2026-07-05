"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "moveapp_admin_access_token";

interface AuthContextValue {
  accessToken: string | null;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setAccessToken(localStorage.getItem(TOKEN_KEY));
    setIsInitialized(true);
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Credenciais inválidas");
    }

    const data = (await res.json()) as { accessToken: string };
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    setAccessToken(data.accessToken);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ accessToken, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return ctx;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStoredAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
