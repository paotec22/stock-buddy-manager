import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { Receipt, PieChart } from "lucide-react";
import type { ProfitExpenseCategory } from "@/utils/profitUtils";

interface ProfitExpensesBreakdownProps {
  totalExpenses: number;
  breakdown: ProfitExpenseCategory[];
}

export function ProfitExpensesBreakdown({
  totalExpenses,
  breakdown,
}: ProfitExpensesBreakdownProps) {
  if (totalExpenses === 0 || breakdown.length === 0) {
    return (
      <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur-sm shadow-sm p-5 text-center text-xs text-muted-foreground">
        No operating expenses recorded for this period and location.
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Operating Expenses Breakdown
          </CardTitle>
          <span className="text-xs font-mono font-bold text-foreground">
            Total: {formatCurrency(totalExpenses)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overhead expenses deducted from Gross Profit to arrive at Net Profit.
        </p>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-3">
        <div className="space-y-2.5">
          {breakdown.map((item) => (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{item.category}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-muted-foreground font-mono w-10 text-right">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, item.percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
