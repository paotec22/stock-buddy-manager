import { SalesTable } from "./SalesTable";
import { Sale } from "./types";
import { Receipt } from "lucide-react";

interface SalesTableViewProps {
  sales: Sale[];
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export function SalesTableView({
  sales,
  hasFilters = false,
  onClearFilters,
}: SalesTableViewProps) {
  return (
    <section aria-labelledby="sales-transactions-heading" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary shrink-0" />
          <h2
            id="sales-transactions-heading"
            className="text-base sm:text-lg font-bold tracking-tight text-foreground"
          >
            Transactions Ledger
          </h2>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            · {sales.length.toLocaleString()}{" "}
            {sales.length === 1 ? "record" : "records"}
          </span>
        </div>
      </div>

      <SalesTable
        sales={sales}
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    </section>
  );
}
