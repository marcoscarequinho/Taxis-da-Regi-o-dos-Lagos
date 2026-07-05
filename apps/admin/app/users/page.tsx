"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "../../src/components/RequireAuth";
import { Shell } from "../../src/components/Shell";
import { ApiAuthError, fetchUsers, type AdminUser } from "../../src/lib/api";

const PAGE_SIZE = 20;

function UsersTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminUser[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUsers(page, PAGE_SIZE)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiAuthError) {
          router.replace("/login");
        } else {
          setError("Não foi possível carregar os usuários.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, router]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Usuários</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.phone}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {user.isPassenger && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Passageiro
                        </span>
                      )}
                      {user.isDriver && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Motorista
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Nenhum usuário encontrado.
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

export default function UsersPage() {
  return (
    <RequireAuth>
      <Shell>
        <UsersTable />
      </Shell>
    </RequireAuth>
  );
}
