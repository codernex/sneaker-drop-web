import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: `${API_BASE}`,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Drop {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  totalStock: number;
  availableStock: number;
  price: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  recentPurchasers: { username: string; purchasedAt: string }[];
}

export interface Reservation {
  reservationId: string;
  expiresAt: string;
  ttlSeconds: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  dropId: string;
  reservationId: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  createdAt: string;
  user: { username: string };
  drop: { name: string; imageUrl: string | null };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export const dropsApi = {
  getAll: () =>
    api.get<{ success: boolean; data: { drops: Drop[] } }>("/drops"),
  getById: (id: string) =>
    api.get<{ success: boolean; data: { drop: Drop } }>(`/drops/${id}`),
  create: (data: {
    name: string;
    description?: string;
    totalStock: number;
    price: number;
    startsAt: string;
    endsAt?: string;
  }) => api.post<{ success: boolean; data: Drop }>("/drops", data),
};

export const usersApi = {
  register: (data: { username: string; email: string }) =>
    api.post<{ success: boolean; data: User }>("/users", data),
  getAll: () =>
    api.get<{ success: boolean; data: { users: User[] } }>("/users"),
};

export const reservationsApi = {
  create: (data: { userId: string; dropId: string }) =>
    api.post<{ success: boolean; data: Reservation }>("/reservations", data),
  cancel: (reservationId: string, userId: string) =>
    api.delete(`/reservations/${reservationId}`, { data: { userId } }),
  getById: (id: string) =>
    api.get<{ success: boolean; data: Reservation }>(`/reservations/${id}`),
};

export const purchasesApi = {
  complete: (data: { userId: string; reservationId: string }) =>
    api.post<{ success: boolean; data: Purchase }>("/purchases", data),
};
