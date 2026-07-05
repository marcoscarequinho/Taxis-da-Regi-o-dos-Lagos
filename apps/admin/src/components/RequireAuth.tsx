"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !accessToken) {
      router.replace("/login");
    }
  }, [isInitialized, accessToken, router]);

  if (!isInitialized || !accessToken) {
    return null;
  }

  return <>{children}</>;
}
