import type { Metadata } from "next";
import { AuthProvider } from "../src/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taxis da Região dos Lagos — Admin",
  description: "Painel administrativo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
