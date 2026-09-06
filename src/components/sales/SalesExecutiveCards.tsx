import { useState } from "react";
import { Eye, EyeOff, TrendingUp, Receipt, Package, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sale } from "./types";
import { formatCurrency } from "@/utils/formatters";

interface SalesExecutiveCardsProps {
  sales: Sale[];
  totalSalesCount: number;
  hasActiveFilters: boolean;
}

export function SalesExecutiveCards({
  sales,
  totalSalesCount,
  hasActiveFilters,
}: SalesExecutiveCardsProps) {
  const [showValues, setShowValues] = useState(true);

  // Compute metrics from current sales view
  const totalRevenue = sales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalQuantity = sales.reduce((acc, s) => acc + (s.quantity || 0), 0);
  
  const totalPaid = sales.reduce((acc, s) => {
    if (s.payment_status === "paid") {
      return acc + (s.total_amount || 0);
    }
    return acc + (s.amount_paid || 0);
  }, 0);

  const totalOutstanding = Math.max(0, totalRevenue - totalPaid);
  const unpaidCount = sales.filter(s => s.payment_status === "unpaid" || s.payment_status === "part_paid").length;
  const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {hasActiveFilters ? "Filtered Overview" : "Sales Overview"}
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-primary whitespace-nowrap">
              {sales.length} of {totalSalesCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowValues(!showValues)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted ml-auto whitespace-nowrap"
          title={showValues ? "Hide sensitive numbers" : "Show sensitive numbers"}
        >
          {showValues ? (
            <>
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Hide Figures</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs">Show Figures</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Revenue */}
        <Card className="p-3 sm:p-5 border border-border/70 hover:border-border transition-colors min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate block">
                Gross Revenue
              </span>
              <div 
                className="text-base sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums truncate"
                title={showValues ? formatCurrency(totalRevenue) : undefined}
              >
                {showValues ? formatCurrency(totalRevenue) : "••••••••"}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                {sales.length} {sales.length === 1 ? "order" : "orders"}
              </p>
            </div>
            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        {/* Units Sold & Orders */}
        <Card className="p-3 sm:p-5 border border-border/70 hover:border-border transition-colors min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate block">
                Units Sold
              </span>
              <div 
                className="text-base sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums truncate"
                title={showValues ? totalQuantity.toLocaleString() : undefined}
              >
                {showValues ? totalQuantity.toLocaleString() : "••••"}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                Physical moved
              </p>
            </div>
            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0 dark:text-blue-400">
              <Package className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        {/* Collections & Receivables */}
        <Card className="p-3 sm:p-5 border border-border/70 hover:border-border transition-colors min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate block">
                  Receivables
                </span>
                {unpaidCount > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-semibold px-1 py-0 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0 whitespace-nowrap">
                    {unpaidCount}
                  </span>
                )}
              </div>
              <div 
                className="text-base sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums truncate"
                title={showValues ? formatCurrency(totalOutstanding) : undefined}
              >
                {showValues ? formatCurrency(totalOutstanding) : "••••••••"}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                Settled: {showValues ? formatCurrency(totalPaid) : "••••"}
              </p>
            </div>
            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0 dark:text-rose-400">
              <AlertCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        {/* Average Transaction Value */}
        <Card className="p-3 sm:p-5 border border-border/70 hover:border-border transition-colors min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate block">
                Avg. Ticket
              </span>
              <div 
                className="text-base sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums truncate"
                title={showValues ? formatCurrency(averageOrderValue) : undefined}
              >
                {showValues ? formatCurrency(averageOrderValue) : "••••••••"}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                Per customer
              </p>
            </div>
            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 shrink-0 dark:text-violet-400">
              <Receipt className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
