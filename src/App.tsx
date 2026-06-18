import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Zap } from "lucide-react";
import { DropsPage } from "@/pages/DropsPage";
import { UserPanel } from "@/components/UserPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight">SneakerDrop</span>
                <span className="ml-2 hidden rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400 sm:inline">
                  LIVE
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Drops grid */}
            <DropsPage />

            {/* Sidebar */}
            <aside className="space-y-4">
              <UserPanel />
              {/* Info card */}
              <div className="rounded-xl border border-border/50 bg-card p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">How it works</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  <li>Register with a username & email</li>
                  <li>Click <strong>Reserve Now</strong> on a drop</li>
                  <li>You have <strong>60 seconds</strong> to complete the purchase</li>
                  <li>If you don't, stock is returned automatically</li>
                </ol>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* Sonner toast provider */}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
      />
    </QueryClientProvider>
  );
}