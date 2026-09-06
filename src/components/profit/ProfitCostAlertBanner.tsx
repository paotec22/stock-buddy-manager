import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import type { ProfitMetrics } from "@/utils/profitUtils";

interface ProfitCostAlertBannerProps {
  metrics: ProfitMetrics;
  onReviewUncosted: () => void;
}

export function ProfitCostAlertBanner({
  metrics,
  onReviewUncosted,
}: ProfitCostAlertBannerProps) {
  if (metrics.uncostedSalesCount === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>100% Cost Audit Complete:</strong> Every recorded sale in this period has a verified unit cost. Profit margins are fully accurate.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 text-amber-950 dark:text-amber-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold flex items-center gap-2">
              <span>{metrics.uncostedSalesCount} Sales Missing Purchase Cost</span>
              <span className="text-xs font-normal opacity-90 font-mono">
                ({formatCurrency(metrics.uncostedRevenue)} uncosted revenue)
              </span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed max-w-3xl">
              Previously, the system treated selling price as the cost price when cost was empty, which incorrectly showed 0% profit.
              We have isolated these items so your verified margins are accurate. Set their unit purchase costs below to include them in your total profit.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={onReviewUncosted}
          className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 font-medium text-xs shrink-0 self-start sm:self-center"
        >
          Review & Set Costs
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
