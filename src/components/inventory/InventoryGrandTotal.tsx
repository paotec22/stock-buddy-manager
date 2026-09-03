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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Value Card */}
      <Card className="border border-border bg-card shadow-sm rounded-lg">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Inventory Value</span>
                <button
                  onClick={() => setShowValue(!showValue)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showValue ? "Hide value" : "Show value"}
                >
                  {showValue ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
                {showValue ? formatCurrency(calculateGrandTotal()) : "••••••••"}
              </p>
              <p className="text-xs text-muted-foreground">
                Location: <span className="font-medium text-foreground">{selectedLocation}</span> • {totalItems} total SKU items
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted text-foreground border border-border">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary Card */}
      <Card className="border border-border bg-card shadow-xs rounded-lg">
        <CardContent className="p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stock Status Filters</span>
              {selectedStatus && (
                <button
                  onClick={() => onStatusClick?.(selectedStatus)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => onStatusClick?.("in-stock")}
                className={`text-center p-2.5 rounded-md border transition-colors cursor-pointer ${
                  selectedStatus === "in-stock"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground mb-1">In Stock</div>
                <p className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{statusCounts.inStock}</p>
              </button>
              <button
                onClick={() => onStatusClick?.("low-stock")}
                className={`text-center p-2.5 rounded-md border transition-colors cursor-pointer ${
                  selectedStatus === "low-stock"
                    ? "border-amber-500 bg-amber-500/5 text-foreground ring-1 ring-amber-500"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground mb-1">Low Stock</div>
                <p className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">{statusCounts.lowStock}</p>
              </button>
              <button
                onClick={() => onStatusClick?.("out-of-stock")}
                className={`text-center p-2.5 rounded-md border transition-colors cursor-pointer ${
                  selectedStatus === "out-of-stock"
                    ? "border-rose-500 bg-rose-500/5 text-foreground ring-1 ring-rose-500"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground mb-1">Out of Stock</div>
                <p className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">{statusCounts.outOfStock}</p>
              </button>
            </div>

            {statusCounts.lowStock > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-md dark:bg-amber-950/30 dark:border-amber-800/50">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                  {statusCounts.lowStock} item{statusCounts.lowStock > 1 ? 's' : ''} requires replenishment
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
