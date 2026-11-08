import { SalesTable } from "./SalesTable";
import { Sale } from "./types";
import { Receipt, CalendarRange, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SalesTableViewProps {
  sales: Sale[];
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onSwitchView?: (view: 'transactions' | 'monthly' | 'chart') => void;
}

export function SalesTableView({
  sales,
  hasFilters = false,
  onClearFilters,
  onSwitchView,
}: SalesTableViewProps) {
  return (
    <section aria-labelledby="sales-transactions-heading" className="space-y-3">
      {/* View Header with in-view switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card/70 border border-border/80 rounded-xl px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary shrink-0" />
          <h2
            id="sales-transactions-heading"
            className="text-sm sm:text-base font-bold tracking-tight text-foreground"
          >
            Transactions Ledger
          </h2>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            · {sales.length.toLocaleString()}{" "}
            {sales.length === 1 ? "record" : "records"}
          </span>
        </div>

        {onSwitchView && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground hidden lg:inline mr-1">Switch view:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSwitchView('monthly')}
              className="h-7 sm:h-8 px-2.5 text-xs font-medium bg-background hover:bg-muted cursor-pointer gap-1.5"
            >
              <CalendarRange className="h-3.5 w-3.5 text-primary" />
              <span>Monthly &amp; Branch Summary</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSwitchView('chart')}
              className="h-7 sm:h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer gap-1"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Analytics</span>
            </Button>
          </div>
        )}
      </div>

      <SalesTable
        sales={sales}
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    </section>
  );
}
