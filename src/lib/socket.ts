import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { Drop } from "./api";

const SOCKET_URL = new URL(
  import.meta.env.VITE_API_URL ?? "http://localhost:4000",
).origin;


interface ServerToClientEvents {
  "stock:update": (data: {
    dropId: string;
    availableStock: number;
    event: string;
    recoveredUnits?: number;
  }) => void;
  "purchase:completed": (data: {
    dropId: string;
    username: string;
    dropName: string;
    purchasedAt: string;
  }) => void;
  "drop:new": (data: { drop: Drop }) => void;
  "reservation:created": (data: {
    reservationId: string;
    expiresAt: string;
  }) => void;
}

// ─── Singleton socket ─────────────────────────────────────────────────────────

type AppSocket = Socket<ServerToClientEvents>;

let socket: AppSocket | null = null;

export const getSocket = (): AppSocket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};


export const useSocket = <K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K],
) => {
  const handlerRef = useRef<ServerToClientEvents[K]>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const s = getSocket();

    const listener = (...args: Parameters<ServerToClientEvents[K]>) => {
      (handlerRef.current as (...a: typeof args) => void)(...args);
    };
    s.on(event, listener as never);
    return () => {
      s.off(event, listener as never);
    };
  }, [event]);
};