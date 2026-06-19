import { DropCard } from "@/components/DropCard";
import { dropsApi, type Drop } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { useUserStore } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";

export function DropsPage() {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["drops"],
    queryFn: () => dropsApi.getAll().then((r) => r.data.data.drops),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  // ── Real-time stock updates ──────────────────────────────────────────────────
  useSocket("stock:update", ({ dropId, availableStock, event }) => {
    queryClient.setQueryData<Drop[]>(["drops"], (old) =>
      old?.map((d) =>
        d.id === dropId ? { ...d, availableStock } : d,
      ),
    );

    if (event === "reservation_expired") {
      toast.info("Stock updated — a reservation expired");
    }
  });

  // ── Activity feed: update recent purchasers on purchase:completed ───────────
  useSocket("purchase:completed", ({ dropId, username }) => {
    queryClient.setQueryData<Drop[]>(["drops"], (old) =>
      old?.map((d) => {
        if (d.id !== dropId) return d;
        const entry = { username, purchasedAt: new Date().toISOString() };
        return {
          ...d,
          recentPurchasers: [entry, ...d.recentPurchasers].slice(0, 3),
        };
      }),
    );
    toast.success(`@${username} just purchased an unit! 🔥`, { duration: 3000 });
  });

  // ── New drop broadcast ───────────────────────────────────────────────────────
  useSocket("drop:new", ({ drop }) => {
    queryClient.setQueryData<Drop[]>(["drops"], (old) => {
      if (!old) return [drop];
      // If the drop already exists (re-broadcast), update it; otherwise prepend it
      const exists = old.some((d) => d.id === drop.id);
      return exists ? old.map((d) => (d.id === drop.id ? { ...d, ...drop } : d)) : [drop, ...old];
    });
    toast.info("A new drop just launched!");
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
        <p>Failed to load drops.</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm underline"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const drops = data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Active Drops</h2>
          <p className="text-sm text-muted-foreground">
            {drops.length} drop{drops.length !== 1 ? "s" : ""} available
            {!user && (
              <span className="ml-2 text-amber-400">
                — register to reserve
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Grid */}
      {drops.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-muted-foreground">
          <Zap className="h-10 w-10 opacity-30" />
          <p className="text-sm">No active drops right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {drops.map((drop) => (
            <DropCard key={drop.id} drop={drop} />
          ))}
        </div>
      )}
    </div>
  );
}
