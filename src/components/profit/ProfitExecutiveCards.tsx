import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PackageCheck,
  Percent,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import type { ProfitMetrics } from "@/utils/profitUtils";

interface ProfitExecutiveCardsProps {
  metrics: ProfitMetrics;
  onViewUncosted?: () => void;
}

export function ProfitExecutiveCards({
  metrics,
  onViewUncosted,
}: ProfitExecutiveCardsProps) {
  const isNetProfitable = metrics.netProfit >= 0;
  const isGrossProfitable = metrics.grossProfit >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {/* ── CARD 1: TOTAL REVENUE ──────────────────────────── */}
      <Card className="card-hover rounded-2xl border-border/70 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Sales Revenue
          </CardTitle>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {formatCurrency(metrics.totalRevenue)}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 text-muted-foreground">
            <span>Cash: <strong className="font-mono text-foreground">{formatCurrency(metrics.cashCollected)}</strong></span>
            {metrics.accountsReceivable > 0 ? (
              <Badge variant="outline" className="text-[10px] h-5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-mono">
                ₦{(metrics.accountsReceivable / 1000).toFixed(0)}k unpaid
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                100% paid
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 2: COST OF GOODS SOLD (COGS) ──────────────── */}
      <Card className="card-hover rounded-2xl border-border/70 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Cost of Goods (COGS)
          </CardTitle>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <PackageCheck className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
            {formatCurrency(metrics.totalCogs)}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 text-muted-foreground">
            <span>Procurement cost</span>
            {metrics.uncostedSalesCount > 0 ? (
              <button
                type="button"
                onClick={onViewUncosted}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                title="Click to view uncosted items"
              >
                <AlertTriangle className="h-3 w-3" />
                {metrics.uncostedSalesCount} pending
              </button>
            ) : (
              <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                100% Costed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 3: GROSS PROFIT ───────────────────────────── */}
      <Card className="card-hover rounded-2xl border-border/70 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden relative">
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            isGrossProfitable ? "from-emerald-500 to-teal-500" : "from-rose-500 to-red-500"
          }`}
        />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Gross Profit & Margin
          </CardTitle>
          <div
            className={`p-2 rounded-xl ${
              isGrossProfitable
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            <Percent className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                isGrossProfitable
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(metrics.grossProfit)}
            </div>
            <Badge
              variant="outline"
              className={`text-xs font-mono font-semibold ${
                metrics.grossMarginPct >= 25
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : metrics.grossMarginPct >= 0
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {metrics.grossMarginPct.toFixed(1)}% margin
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 text-muted-foreground">
            <span>Cash realized:</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(metrics.cashGrossProfit)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 4: NET PROFIT ─────────────────────────────── */}
      <Card className="card-hover rounded-2xl border-border/70 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden relative">
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            isNetProfitable ? "from-emerald-500 to-green-600" : "from-rose-500 to-red-600"
          }`}
        />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Net Operating Profit
          </CardTitle>
          <div
            className={`p-2 rounded-xl ${
              isNetProfitable
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            <Wallet className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold font-mono tracking-tight ${
                isNetProfitable
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {formatCurrency(metrics.netProfit)}
            </div>
            <Badge
              variant="outline"
              className={`text-xs font-mono font-semibold ${
                isNetProfitable
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {metrics.netMarginPct.toFixed(1)}% net
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50 text-muted-foreground">
            <span>Expenses deducted:</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(metrics.totalExpenses)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
