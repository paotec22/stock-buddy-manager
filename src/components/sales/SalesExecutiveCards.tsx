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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {hasActiveFilters ? "Filtered Sales Overview" : "Sales Overview"}
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              Showing {sales.length} of {totalSalesCount} transactions
            </span>
          )}
        </div>
        <button
          onClick={() => setShowValues(!showValues)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          title={showValues ? "Hide sensitive numbers" : "Show sensitive numbers"}
        >
          {showValues ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>Hide Figures</span>
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>Show Figures</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <Card className="p-4 sm:p-5 border border-border/70 hover:border-border transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Gross Sales Revenue</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                {showValues ? formatCurrency(totalRevenue) : "••••••••"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Across {sales.length} {sales.length === 1 ? "order" : "orders"}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Units Sold & Orders */}
        <Card className="p-4 sm:p-5 border border-border/70 hover:border-border transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Total Units Sold</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                {showValues ? totalQuantity.toLocaleString() : "••••"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Physical items moved
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:text-blue-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Collections & Receivables */}
        <Card className="p-4 sm:p-5 border border-border/70 hover:border-border transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Unpaid Receivables</span>
                {unpaidCount > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {unpaidCount} open
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                {showValues ? formatCurrency(totalOutstanding) : "••••••••"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Settled: {showValues ? formatCurrency(totalPaid) : "••••••"}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Average Transaction Value */}
        <Card className="p-4 sm:p-5 border border-border/70 hover:border-border transition-colors">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Avg. Ticket Size</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                {showValues ? formatCurrency(averageOrderValue) : "••••••••"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Revenue per transaction
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
