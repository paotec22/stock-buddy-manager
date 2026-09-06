import { Card, CardContent } from "@/components/ui/card";
import { InventoryItem } from "@/utils/inventoryUtils";
import { formatCurrency } from "@/utils/formatters";
import { StatusBadge, getStockStatus, StockStatus } from "@/components/ui/status-badge";
import { Package, TrendingUp, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface InventoryGrandTotalProps {
  items: InventoryItem[];
  selectedLocation: string;
  onStatusClick?: (status: StockStatus) => void;
  selectedStatus?: StockStatus | null;
}

export function InventoryGrandTotal({ items, selectedLocation, onStatusClick, selectedStatus }: InventoryGrandTotalProps) {
  const [showValue, setShowValue] = useState(true);
  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = item.Price * item.Quantity;
      return sum + itemTotal;
    }, 0);
  };

  const calculateStatusCounts = () => {
    const counts = {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0
    };

    items.forEach(item => {
      const status = getStockStatus(item.Quantity || 0);
      if (status === "in-stock") counts.inStock++;
      else if (status === "low-stock") counts.lowStock++;
      else if (status === "out-of-stock") counts.outOfStock++;
    });

    return counts;
  };

  if (items.length === 0) return null;

  const statusCounts = calculateStatusCounts();
  const totalItems = items.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Primary Stat Card: Total Value (dominates visually, spans 2 cols on lg) */}
      <div className="lg:col-span-2 rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] transition-all duration-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Inventory Value
              </span>
              <button
                onClick={() => setShowValue(!showValue)}
                className="p-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showValue ? "Hide value" : "Show value"}
              >
                {showValue ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-foreground tabular-nums">
                {showValue ? formatCurrency(calculateGrandTotal()) : "••••••••"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium text-foreground">
                Location: {selectedLocation}
              </span>
              <span>•</span>
              <span className="font-mono tabular-nums font-semibold text-foreground">{totalItems}</span> total active SKUs
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end justify-between self-stretch">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">Live Valuation</span>
          </div>
        </div>
      </div>

      {/* Secondary Card: Stock Health Breakdown */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Stock Health Status
            </span>
            {selectedStatus && (
              <button
                onClick={() => onStatusClick?.(selectedStatus)}
                className="text-xs text-primary hover:underline font-medium"
              >
                Reset filter
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onStatusClick?.("in-stock")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all cursor-pointer ${
                selectedStatus === "in-stock"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/40"
                  : "border-border/80 bg-muted/30 hover:bg-muted/60"
              }`}
            >
              <span className="text-[11px] font-medium text-muted-foreground mb-1">In Stock</span>
              <span className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {statusCounts.inStock}
              </span>
            </button>
            <button
              onClick={() => onStatusClick?.("low-stock")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all cursor-pointer ${
                selectedStatus === "low-stock"
                  ? "border-amber-500/40 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40"
                  : "border-border/80 bg-muted/30 hover:bg-muted/60"
              }`}
            >
              <span className="text-[11px] font-medium text-muted-foreground mb-1">Low Stock</span>
              <span className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                {statusCounts.lowStock}
              </span>
            </button>
            <button
              onClick={() => onStatusClick?.("out-of-stock")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all cursor-pointer ${
                selectedStatus === "out-of-stock"
                  ? "border-rose-500/40 bg-rose-500/10 text-foreground ring-1 ring-rose-500/40"
                  : "border-border/80 bg-muted/30 hover:bg-muted/60"
              }`}
            >
              <span className="text-[11px] font-medium text-muted-foreground mb-1">Out</span>
              <span className="text-xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400">
                {statusCounts.outOfStock}
              </span>
            </button>
          </div>

          {statusCounts.lowStock > 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg dark:bg-amber-500/15">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                {statusCounts.lowStock} item{statusCounts.lowStock > 1 ? 's' : ''} below threshold
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground text-center py-1">
              All active inventory levels healthy
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
