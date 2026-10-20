import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { toast } from "sonner";
import {
  Zap,
  Gauge,
  Database,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Layers,
  Sparkles,
  Server,
  Activity,
} from "lucide-react";

interface SystemSpeedHealthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lastQueryTimeMs?: number;
}

export function SystemSpeedHealthModal({
  open,
  onOpenChange,
  lastQueryTimeMs,
}: SystemSpeedHealthModalProps) {
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  const [dbLatency, setDbLatency] = useState<number | null>(lastQueryTimeMs || null);
  const [isPinging, setIsPinging] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    totalQueries: 0,
    freshQueries: 0,
    staleQueries: 0,
    fetchingCount: 0,
  });
  const [storageEstimate, setStorageEstimate] = useState<{
    usedMb: number;
    quotaMb: number;
    pct: number;
  }>({ usedMb: 0, quotaMb: 0, pct: 0 });

  // Compute live cache stats
  const refreshStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();
    const fetching = allQueries.filter((q) => q.state.status === "pending" || q.state.fetchStatus === "fetching").length;
    const fresh = allQueries.filter((q) => !q.isStale()).length;
    const stale = allQueries.length - fresh;

    setCacheStats({
      totalQueries: allQueries.length,
      freshQueries: fresh,
      staleQueries: stale,
      fetchingCount: fetching,
    });

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        const usedMb = Math.round((est.usage || 0) / (1024 * 1024) * 10) / 10;
        const quotaMb = Math.round((est.quota || 0) / (1024 * 1024) * 10) / 10;
        const pct = quotaMb > 0 ? Math.min(100, Math.round((usedMb / quotaMb) * 100)) : 0;
        setStorageEstimate({ usedMb, quotaMb, pct });
      }).catch(() => {
        // Ignore storage estimate failure
      });
    }
  }, [queryClient]);

  // Test live DB latency
  const runPingTest = useCallback(async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await supabase.from("profiles").select("id").limit(1);
      const duration = Math.round(performance.now() - start);
      setDbLatency(duration);
    } catch {
      setDbLatency(null);
    } finally {
      setIsPinging(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      refreshStats();
      runPingTest();
    }
  }, [open, refreshStats, runPingTest]);

  // 1-Click Speed Optimizer
  const handleOptimizeSpeed = async () => {
    setIsOptimizing(true);
    const t0 = performance.now();
    try {
      // 1. Remove dead/inactive queries from TanStack cache
      const cache = queryClient.getQueryCache();
      const allQueries = cache.getAll();
      let cleaned = 0;
      allQueries.forEach((q) => {
        if (q.getObserversCount() === 0 && q.isStale()) {
          cache.remove(q);
          cleaned++;
        }
      });

      // 2. Pre-warm key active queries
      await Promise.allSettled([
        queryClient.refetchQueries({ queryKey: ["dashboard-metrics"], type: "active" }),
        queryClient.refetchQueries({ queryKey: ["user-role"], type: "active" }),
      ]);

      refreshStats();
      await runPingTest();

      const timeTaken = Math.round(performance.now() - t0);
      toast.success(
        `System speed optimized in ${timeTaken}ms! Pruned ${cleaned} stale cache queries.`
      );
    } catch {
      toast.error("Speed optimization encountered a transient error");
    } finally {
      setIsOptimizing(false);
    }
  };

  const getLatencyBadge = () => {
    if (dbLatency === null) {
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          Checking...
        </Badge>
      );
    }
    if (dbLatency <= 60) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono">
          ⚡ {dbLatency}ms · Ultra Fast
        </Badge>
      );
    }
    if (dbLatency <= 180) {
      return (
        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-mono">
          ✓ {dbLatency}ms · Nominal
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-mono">
        ⚠ {dbLatency}ms · Elevated Latency
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-gradient-to-r from-muted/50 to-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Gauge className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  System Speed & Operational Pulse
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Real-time diagnostics, memory cache health, and database latency
                </DialogDescription>
              </div>
            </div>
            {getLatencyBadge()}
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* DB Roundtrip Latency */}
            <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                <span className="flex items-center gap-1">
                  <Server className="h-3.5 w-3.5" />
                  DB Latency
                </span>
                <button
                  type="button"
                  onClick={runPingTest}
                  disabled={isPinging}
                  className="hover:text-foreground text-primary text-[10px]"
                  title="Ping again"
                >
                  <RefreshCw className={`h-3 w-3 ${isPinging ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="text-lg font-bold text-foreground font-mono">
                {dbLatency !== null ? `${dbLatency}ms` : "—"}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Supabase PostgreSQL roundtrip
              </p>
            </div>

            {/* In-Memory Cached Queries */}
            <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
              <div className="flex items-center text-muted-foreground text-[11px] font-medium gap-1">
                <Database className="h-3.5 w-3.5" />
                Cache Queries
              </div>
              <div className="text-lg font-bold text-foreground font-mono">
                {cacheStats.totalQueries}
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {cacheStats.freshQueries} instant hits (0ms)
              </p>
            </div>

            {/* Offline & Network State */}
            <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center text-muted-foreground text-[11px] font-medium gap-1">
                <Activity className="h-3.5 w-3.5" />
                Network Mode
              </div>
              <div className="text-lg font-bold text-foreground flex items-center gap-1.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span className="text-sm font-semibold">{isOnline ? "Online" : "Offline"}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isOnline ? "IndexedDB sync active" : "Offline cache active"}
              </p>
            </div>
          </div>

          {/* Cache Quality & Pipeline Breakdown */}
          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Client-Side Cache Efficiency
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {cacheStats.totalQueries > 0
                  ? `${Math.round((cacheStats.freshQueries / cacheStats.totalQueries) * 100)}%`
                  : "100%"}
              </span>
            </div>
            <Progress
              value={
                cacheStats.totalQueries > 0
                  ? (cacheStats.freshQueries / cacheStats.totalQueries) * 100
                  : 100
              }
              className="h-1.5"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Fresh in memory: <strong className="text-foreground">{cacheStats.freshQueries}</strong></span>
              <span>Background revalidating: <strong className="text-foreground">{cacheStats.fetchingCount}</strong></span>
              <span>Stale ready to prune: <strong className="text-foreground">{cacheStats.staleQueries}</strong></span>
            </div>
          </div>

          {/* Browser Storage Quota */}
          <div className="p-3 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">IndexedDB Offline Storage</p>
                <p className="text-[10px] text-muted-foreground">
                  {storageEstimate.usedMb > 0
                    ? `${storageEstimate.usedMb} MB used across local collections`
                    : "Active offline cache engine"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Ready
            </Badge>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/70">
            <Button
              type="button"
              onClick={handleOptimizeSpeed}
              disabled={isOptimizing}
              className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs font-medium"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Optimizing Pipeline...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Run Speed & Memory Optimization
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
