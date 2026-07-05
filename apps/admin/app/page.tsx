"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../src/lib/auth";

export default function HomePage() {
  const { accessToken, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;
    router.replace(accessToken ? "/users" : "/login");
  }, [isInitialized, accessToken, router]);

  return null;
}
