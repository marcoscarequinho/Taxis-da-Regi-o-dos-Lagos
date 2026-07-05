import { clearStoredAccessToken, getStoredAccessToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiAuthError extends Error {}

export async function apiFetch<T>(path: string): Promise<T> {
  const token = getStoredAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401 || res.status === 403) {
    clearStoredAccessToken();
    throw new ApiAuthError("Sessão expirada ou acesso não autorizado");
  }

  if (!res.ok) {
    throw new Error(`Erro ao consultar ${path}: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isDriver: boolean;
  isPassenger: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AdminRide {
  id: string;
  status: string;
  originAddress: string;
  destinationAddress: string;
  estimatedFare: number | null;
  finalFare: number | null;
  paymentMethod: string;
  requestedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  passenger: { name: string; email: string };
  driver: { name: string; email: string } | null;
  payment: { status: string; amount: number } | null;
}

export function fetchUsers(page: number, pageSize: number) {
  return apiFetch<Paginated<AdminUser>>(`/admin/users?page=${page}&pageSize=${pageSize}`);
}

export function fetchRides(page: number, pageSize: number) {
  return apiFetch<Paginated<AdminRide>>(`/admin/rides?page=${page}&pageSize=${pageSize}`);
}
