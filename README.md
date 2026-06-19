# Sneaker Drop — Frontend

React frontend for the **Limited Edition Sneaker Drop** technical assessment.
Built with **React 19**, **Vite**, **Tailwind CSS v4**, **Shadcn/UI**, **TanStack Query**, and **Socket.io-client**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [State Management](#state-management)
- [Real-Time Architecture](#real-time-architecture)

---

## Tech Stack

| Layer            | Technology                          |
|------------------|-------------------------------------|
| Framework        | React 19 (with React Compiler)      |
| Build Tool       | Vite 8                              |
| Styling          | Tailwind CSS v4                     |
| Component Library| Shadcn/UI (Radix Nova style)        |
| Server State     | TanStack Query v5                   |
| Client State     | Zustand v5 (with `persist`)         |
| HTTP Client      | Axios                               |
| Real-time        | Socket.io-client v4                 |
| Toasts           | Sonner                              |
| Icons            | Lucide React                        |
| Language         | TypeScript 6                        |

---

## Features

### Drop Dashboard
- Fetches and displays all active merch drops in a responsive grid.
- Each **DropCard** shows: name, price, image, animated stock progress bar, and a "Recent Buyers" activity feed (top 3 purchasers).
- Stock count updates **instantly** via WebSocket without a page refresh.

### Atomic Reservation Flow
1. Register with a username and email via the **User Panel** in the sidebar.
2. Click **Reserve Now** on any drop card — the button shows a loading spinner while the request is in flight.
3. On success, the card transitions to a **60-second countdown timer**.
4. Click **Complete Purchase** before the timer runs out to finalize.
5. If the timer expires, the reservation is cleared client-side, the drop's stock is restored server-side, and a warning toast is displayed.

### UI Feedback
- Loading spinners on all async actions (Reserve, Purchase, Create Drop).
- Toast notifications (Sonner) for success, error, warning, and info states.
- Typed error handling via `showPrettyError` — API error messages from the server are surfaced cleanly.
- Stock badge changes color: green → amber (≤5 units) → red (0 units).
- "Sold Out" badge overlaid on the card image when `availableStock = 0`.

### Admin: Create Drop
- Initializes a new merch drop via `POST /api/v1/drops`; all connected clients are notified via the `drop:new` WebSocket event and their drop lists are automatically refreshed.

---

## Running Locally

### Prerequisites

- Node.js ≥ 20
- pnpm (`npm install -g pnpm`)
- The backend (`sneaker-drop-api`) running on port `4000`

### 1. Clone & Install

```bash
git clone git@github.com:codernex/sneaker-drop-web.git
cd sneaker-drop-web
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

> The socket client automatically strips the `/api` suffix from `VITE_API_URL` to derive the WebSocket URL.

### 3. Start Development Server

```bash
pnpm dev
```

App runs at **http://localhost:5173**.

### 4. Production Build

```bash
pnpm build      # tsc + vite build → dist/
pnpm preview    # preview the production bundle locally
```

---

## Environment Variables

| Variable       | Default                   | Description                        |
|----------------|---------------------------|------------------------------------|
| `VITE_API_URL` | `http://localhost:4000`   | Base URL of the backend API server |

> All `VITE_` prefixed variables are inlined at build time by Vite and are safe to expose (no secrets).

---

## State Management

Two Zustand stores handle all client-side state, both persisted to `localStorage` so sessions survive page refreshes.

### `useUserStore`
Stores the registered user (`id`, `username`, `email`). Set on successful registration via `POST /api/v1/users`.

### `useReservationStore`
A map of `dropId → ActiveReservation`. Each entry holds the `reservationId` and `expiresAt` timestamp.

- Written on a successful `POST /api/v1/reservations`.
- Cleared on purchase completion, cancellation, or countdown expiry.
- The `DropCard` derives `isReserved` by checking `expiresAt > now`, ensuring stale persisted reservations are treated as expired even after a page refresh.

---

## Real-Time Architecture

The frontend maintains a **single, lazily-initialized Socket.io connection** (`src/lib/socket.ts`). All components subscribe to events via the `useSocket(event, handler)` hook, which safely captures the latest handler reference without re-subscribing on every render.

### How socket events update the UI

All real-time state updates are applied directly to the **TanStack Query cache** using `queryClient.setQueryData`, so the UI re-renders immediately without any additional HTTP request.

| Server Event          | UI Action                                                                 |
|-----------------------|---------------------------------------------------------------------------|
| `stock:update`        | Patches `availableStock` on the matching drop in the query cache           |
| `purchase:completed`  | Prepends the new purchaser to `recentPurchasers` in the query cache (capped at 3) |
| `drop:new`            | Invalidates the drops query, triggering a refetch                          |
| `reservation:created` | _(server emits to drop room only — handled by the reserving client's mutation)_ |

Drop-scoped rooms (`drop:join` / `drop:leave`) are available at the backend but not wired at component level in this version — all broadcasts are currently global.
