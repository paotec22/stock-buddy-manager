import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/utils/formatters";
import { 
  TrendingUp, 
  TrendingDown, 
  Wrench, 
  DollarSign, 
  Eye, 
  EyeOff,
  ShoppingBag
} from "lucide-react";

interface ReportsOverviewKpisProps {
  dateFrom?: Date;
  dateTo?: Date;
}

export function ReportsOverviewKpis({ dateFrom, dateTo }: ReportsOverviewKpisProps) {
  const [showValues, setShowValues] = useState(true);

  // 1. Fetch Expenses Sum
  const { data: expensesData } = useQuery({
    queryKey: ['kpi-expenses', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase.from('expenses').select('amount, expense_date');
      if (dateFrom) query = query.gte('expense_date', dateFrom.toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte('expense_date', end.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      const total = (data || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      return { total, count: data?.length || 0 };
    },
  });

  // 2. Fetch Installations Sum
  const { data: installationsData } = useQuery({
    queryKey: ['kpi-installations', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase.from('installations').select('amount, installation_date');
      if (dateFrom) query = query.gte('installation_date', dateFrom.toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte('installation_date', end.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      const total = (data || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      return { total, count: data?.length || 0 };
    },
  });

  // 3. Fetch Sales Sum
  const { data: salesData } = useQuery({
    queryKey: ['kpi-sales', dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase.from('sales').select('total_amount, sale_date');
      if (dateFrom) query = query.gte('sale_date', dateFrom.toISOString());
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query = query.lte('sale_date', end.toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      const total = (data || []).reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
      return { total, count: data?.length || 0 };
    },
  });

  const totalSales = salesData?.total || 0;
  const salesCount = salesData?.count || 0;
  const totalExpenses = expensesData?.total || 0;
  const expensesCount = expensesData?.count || 0;
  const totalInstallations = installationsData?.total || 0;
  const installationsCount = installationsData?.count || 0;

  // Net Operating Cashflow (Sales + Installations - Expenses)
  const netCashFlow = totalSales + totalInstallations - totalExpenses;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Financial & Operational Highlights
          </span>
          {(dateFrom || dateTo) && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-primary whitespace-nowrap">
              Filtered Period
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowValues(!showValues)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted ml-auto whitespace-nowrap"
          title={showValues ? "Hide figures" : "Show figures"}
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
        {/* Gross Sales */}
        <Card className="p-3 sm:p-5 border border-border/70 hover:border-border transition-colors min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate block">
                Gross Sales
              </span>
              <div 
                className="text-base sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums truncate"
                title={showValues ? formatCurrency(totalSales) : undefined}
              >
                {showValues ? formatCurrency(totalSales) : "••••••••"}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                {salesCount} {salesCount === 1 ? 'sale' : 'sales recorded'}
              </p>
            </div>
            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0 dark:text-emerald-400">
              <ShoppingBag className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        {/* Operating Expenses */}
        <Card className="p-3 sm:p-5 border border-border/70 hover:border-border transition-colors min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate block">
                Total Expenses
              </span>
              <div 
                className="text-base sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums truncate"
                title={showValues ? formatCurrency(totalExpenses) : undefined}
              >
                {showValues ? formatCurrency(totalExpenses) : "••••••••"}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                {expensesCount} {expensesCount === 1 ? 'expense' : 'expenses logged'}
              </p>
            </div>
            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0 dark:text-rose-400">
              <TrendingDown className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        {/* Installations Revenue */}
        <Card className="p-3 sm:p-5 border border-border/70 hover:border-border transition-colors min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate block">
                Installations
              </span>
              <div 
                className="text-base sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums truncate"
                title={showValues ? formatCurrency(totalInstallations) : undefined}
              >
                {showValues ? formatCurrency(totalInstallations) : "••••••••"}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                {installationsCount} {installationsCount === 1 ? 'job' : 'jobs completed'}
              </p>
            </div>
            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0 dark:text-blue-400">
              <Wrench className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>

        {/* Net Flow */}
        <Card className="p-3 sm:p-5 border border-border/70 hover:border-border transition-colors min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate block">
                Net Operating Balance
              </span>
              <div 
                className={`text-base sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight tabular-nums truncate ${
                  netCashFlow >= 0 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-rose-600 dark:text-rose-400'
                }`}
                title={showValues ? formatCurrency(netCashFlow) : undefined}
              >
                {showValues ? formatCurrency(netCashFlow) : "••••••••"}
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                {netCashFlow >= 0 ? 'Surplus balance' : 'Deficit balance'}
              </p>
            </div>
            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 shrink-0 dark:text-violet-400">
              <TrendingUp className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
