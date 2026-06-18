import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag, Clock, CheckCircle, Loader2, Users } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/Countdown";
import { reservationsApi, purchasesApi, type Drop } from "@/lib/api";
import { useUserStore, useReservationStore } from "@/lib/store";
import axios from "axios";
import { showPrettyError } from "@/lib/error";

interface DropCardProps {
  drop: Drop;
}

export function DropCard({ drop }: DropCardProps) {
  const user = useUserStore((s) => s.user);
  const reservation = useReservationStore((s) => s.reservations[drop.id]);
  const setReservation = useReservationStore((s) => s.setReservation);
  const clearReservation = useReservationStore((s) => s.clearReservation);
  const queryClient = useQueryClient();
  const [purchased, setPurchased] = useState(false);

  const isReserved = !!reservation && new Date(reservation.expiresAt) > new Date();
  const isOutOfStock = drop.availableStock <= 0;

  // ── Reserve ──────────────────────────────────────────────────────────────────
  const { mutate: reserve, isPending: reserving } = useMutation({
    mutationFn: () => {
      if (!user) throw new Error("Please register first");
      return reservationsApi.create({ userId: user.id, dropId: drop.id });
    },
    onSuccess: (res) => {
      const data = res.data.data;
      setReservation(drop.id, { ...data, dropId: drop.id });
      toast.success("Reserved! You have 60 seconds to complete your purchase.", {
        duration: 4000,
      });
    },
    onError: (err) => {
      showPrettyError(err)
    },
  });

  // ── Purchase ─────────────────────────────────────────────────────────────────
  const { mutate: completePurchase, isPending: purchasing } = useMutation({
    mutationFn: () => {
      if (!user || !reservation) throw new Error("No active reservation");
      return purchasesApi.complete({
        userId: user.id,
        reservationId: reservation.reservationId,
      });
    },
    onSuccess: () => {
      clearReservation(drop.id);
      setPurchased(true);
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      toast.success("🎉 Purchase complete! Enjoy your kicks.", { duration: 5000 });
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Purchase failed"
        : "Purchase failed";
      if (msg.toLowerCase().includes("expired")) {
        clearReservation(drop.id);
      }
      toast.error(msg);
    },
  });

  const handleExpired = () => {
    clearReservation(drop.id);
    queryClient.invalidateQueries({ queryKey: ["drops"] });
    toast.warning("Your reservation expired. The item has been returned to stock.");
  };

  const stockColor =
    drop.availableStock === 0
      ? "text-red-400"
      : drop.availableStock <= 5
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <Card className="group flex flex-col overflow-hidden border-border/60 bg-card transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/20">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {drop.imageUrl ? (
          <img
            src={drop.imageUrl}
            alt={drop.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {/* Stock badge overlay */}
        <div className="absolute right-3 top-3">
          <Badge
            variant={isOutOfStock ? "destructive" : "secondary"}
            className="font-mono text-xs"
          >
            {isOutOfStock ? "SOLD OUT" : `${drop.availableStock} left`}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">{drop.name}</h3>
          <span className="shrink-0 text-lg font-bold text-primary">
            ${Number(drop.price).toFixed(2)}
          </span>
        </div>
        {drop.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{drop.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        {/* Stock bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available stock</span>
            <span className={`font-semibold ${stockColor}`}>
              {drop.availableStock}/{drop.totalStock}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{
                width: `${drop.totalStock > 0 ? (drop.availableStock / drop.totalStock) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Recent purchasers activity feed */}
        {drop.recentPurchasers.length > 0 && (
          <div className="space-y-1.5 rounded-lg bg-muted/50 p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="h-3 w-3" />
              Recent buyers
            </div>
            {drop.recentPurchasers.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-medium">@{p.username}</span>
                <span className="text-muted-foreground">
                  {new Date(p.purchasedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Active reservation timer */}
        {isReserved && (
          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Clock className="h-3.5 w-3.5" />
              Reserved — complete purchase
            </div>
            <Countdown expiresAt={reservation.expiresAt} onExpired={handleExpired} />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-0">
        {purchased ? (
          <Button disabled className="w-full gap-2 bg-emerald-600 text-white">
            <CheckCircle className="h-4 w-4" />
            Purchased!
          </Button>
        ) : isReserved ? (
          <Button
            className="w-full"
            onClick={() => completePurchase()}
            disabled={purchasing}
          >
            {purchasing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Complete Purchase
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isOutOfStock ? "secondary" : "default"}
            disabled={isOutOfStock || reserving || !user}
            onClick={() => reserve()}
          >
            {reserving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isOutOfStock ? "Sold Out" : "Reserve Now"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
