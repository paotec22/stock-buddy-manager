import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useState } from "react";

export function TotalSalesSummary() {
  const currentYear = new Date().getFullYear();
  const [showValue, setShowValue] = useState(true);

  const { data: totalSales, isLoading, error } = useQuery({
    queryKey: ['totalSales', currentYear],
    queryFn: async () => {
      console.log(`Fetching total sales data for year ${currentYear}...`);
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const { data, error } = await supabase
        .from('sales')
        .select('total_amount, sale_date')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);
      
      if (error) {
        console.error('Error fetching total sales:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No sales data found for current year');
        return { totalAmount: 0, year: currentYear };
      }

      // Calculate total for the current year
      const totalAmount = data.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
      console.log(`Total sales for ${currentYear}: ${totalAmount}`);

      return { totalAmount, year: currentYear };
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Current Year Sales Summary</h2>
        <div>Loading sales data...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Current Year Sales Summary</h2>
        <div className="text-red-500">Error loading sales data. Please try again later.</div>
      </Card>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] mb-4 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Year-to-Date Revenue ({totalSales?.year})
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
              {showValue ? formatCurrency(totalSales?.totalAmount || 0) : "••••••••"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Cumulative settled and logged transactions across all branch channels
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-end justify-between self-stretch">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Fiscal Year {totalSales?.year}</span>
        </div>
      </div>
    </div>
  );
}