"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";

const NAV_ITEMS = [
  { href: "/users", label: "Usuários" },
  { href: "/rides", label: "Corridas" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-900">Taxis da Região dos Lagos — Admin</span>
            <nav className="flex gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    pathname === item.href
                      ? "text-sm font-medium text-slate-900"
                      : "text-sm font-medium text-slate-500 hover:text-slate-900"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
