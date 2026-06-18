import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Reservation } from "./api";

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: "sneaker-drop-user" },
  ),
);

// ─── Reservation store — tracks active reservations per drop ──────────────────

interface ActiveReservation extends Reservation {
  dropId: string;
}

interface ReservationStore {
  reservations: Record<string, ActiveReservation>; // keyed by dropId
  setReservation: (dropId: string, res: ActiveReservation) => void;
  clearReservation: (dropId: string) => void;
  clearAllReservations: () => void;
}

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set) => ({
      reservations: {},
      setReservation: (dropId, res) =>
        set((state) => ({
          reservations: { ...state.reservations, [dropId]: res },
        })),
      clearReservation: (dropId) =>
        set((state) => {
          const next = { ...state.reservations };
          delete next[dropId];
          return { reservations: next };
        }),
      clearAllReservations: () => set({ reservations: {} }),
    }),
    { name: "sneaker-drop-reservations" },
  ),
);
