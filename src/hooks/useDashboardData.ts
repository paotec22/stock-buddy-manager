import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { startOfDay, subDays, format, isAfter } from "date-fns";
import { getItemCostCache } from "@/utils/profitUtils";

export const useDashboardData = () => {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      // Fetch Sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, sale_date, actual_purchase_price, quantity, item_id')
        .gte('sale_date', thirtyDaysAgo)
        .order('sale_date', { ascending: true });

      if (salesError) throw salesError;

      // Fetch Expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', thirtyDaysAgo);

      if (expensesError) throw expensesError;

      // Fetch Pending Installations
      const { data: pendingInstallations, error: installationsError } = await supabase
        .from('installation_requests')
        .select('id, status')
        .eq('status', 'Not installed');

      if (installationsError) throw installationsError;

      let todaysSalesAmount = 0;
      let totalSales30Days = 0;
      let totalExpenses30Days = 0;
      let netProfit30Days = 0;

      // Calculate Chart Data
      const chartDataMap = new Map<string, number>();
      
      // Initialize last 30 days in map
      for (let i = 29; i >= 0; i--) {
        const dateStr = format(subDays(new Date(), i), 'MMM dd');
        chartDataMap.set(dateStr, 0);
      }

      const costCache = getItemCostCache();

      sales?.forEach(sale => {
        const amount = Number(sale.total_amount || 0);
        totalSales30Days += amount;
        
        if (isAfter(new Date(sale.sale_date), new Date(today))) {
          todaysSalesAmount += amount;
        }

        // Add to chart
        if (sale.sale_date) {
            const dateStr = format(new Date(sale.sale_date), 'MMM dd');
            if (chartDataMap.has(dateStr)) {
              chartDataMap.set(dateStr, (chartDataMap.get(dateStr) || 0) + amount);
            }
        }
        
        // Calculate Profit (Sale price - Purchase cost)
        const itemId = sale.item_id ? String(sale.item_id) : "";
        const cachedCost = itemId && costCache[itemId] ? costCache[itemId] : 0;
        const unitCost = Number(sale.actual_purchase_price || cachedCost || 0);
        const purchaseCost = unitCost * Number(sale.quantity || 1);
        netProfit30Days += (amount - purchaseCost);
      });

      expenses?.forEach(expense => {
        const amount = Number(expense.amount || 0);
        totalExpenses30Days += amount;
      });
      
      netProfit30Days -= totalExpenses30Days;

      const chartData = Array.from(chartDataMap.entries()).map(([date, revenue]) => ({
        date,
        revenue
      }));

      return {
        todaysSalesAmount,
        totalSales30Days,
        totalExpenses30Days,
        netProfit30Days,
        pendingInstallationsCount: pendingInstallations?.length || 0,
        chartData
      };
    },
    enabled: !!session
  });
};
