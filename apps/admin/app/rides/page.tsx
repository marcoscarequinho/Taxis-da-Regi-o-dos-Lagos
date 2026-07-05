"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "../../src/components/RequireAuth";
import { Shell } from "../../src/components/Shell";
import { ApiAuthError, fetchRides, type AdminRide } from "../../src/lib/api";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  REQUESTED: "bg-slate-100 text-slate-700",
  SEARCHING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  ARRIVED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function formatFare(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function RidesTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminRide[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRides(page, PAGE_SIZE)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiAuthError) {
          router.replace("/login");
        } else {
          setError("Não foi possível carregar as corridas.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, router]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Corridas</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Passageiro</th>
                <th className="px-4 py-3 font-medium">Motorista</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Solicitada em</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ride) => (
                <tr key={ride.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-900">{ride.passenger.name}</td>
                  <td className="px-4 py-3 text-slate-600">{ride.driver?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[ride.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {ride.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatFare(ride.finalFare ?? ride.estimatedFare)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(ride.requestedAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Nenhuma corrida encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RidesPage() {
  return (
    <RequireAuth>
      <Shell>
        <RidesTable />
      </Shell>
    </RequireAuth>
  );
}
