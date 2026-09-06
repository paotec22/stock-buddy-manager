import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Coins,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  PiggyBank,
} from "lucide-react";
import type { ProfitMetrics } from "@/utils/profitUtils";

interface ProfitCashVsAccrualCardProps {
  metrics: ProfitMetrics;
}

export function ProfitCashVsAccrualCard({ metrics }: ProfitCashVsAccrualCardProps) {
  const cashNetProfit = metrics.cashGrossProfit - metrics.totalExpenses;

  return (
    <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Cash Flow vs. Booked Profitability Reality Check
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accrual accounting records profit when sales happen; cash accounting tracks money actually received in your bank.
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-mono font-medium rounded-lg self-start sm:self-auto"
          >
            {metrics.collectionRatePct.toFixed(0)}% Collection Rate
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Method 1: Booked Profit */}
          <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-500" /> Booked Profit (Accrual)
              </span>
              <span className="text-[11px] text-muted-foreground">Invoiced</span>
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {formatCurrency(metrics.grossProfit)}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on total invoiced sales (<strong>{formatCurrency(metrics.totalRevenue)}</strong>) minus total procurement cost (<strong>{formatCurrency(metrics.totalCogs)}</strong>).
            </p>
          </div>

          {/* Method 2: Cash Realized Profit */}
          <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <PiggyBank className="h-3.5 w-3.5 text-emerald-500" /> Cash Realized Profit
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">In Bank</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.cashGrossProfit)}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Actual gross profit realized from cash collected (<strong>{formatCurrency(metrics.cashCollected)}</strong>) after covering item costs.
            </p>
          </div>

          {/* Outstanding Uncollected Receivables */}
          <div className="rounded-xl border border-border/80 bg-background/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Profit Held in Receivables
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Uncollected</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(metrics.accountsReceivable)}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Customer balances yet to be paid. Collecting these receivables directly turns booked profit into liquid cash.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
