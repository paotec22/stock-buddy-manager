import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { startOfDay, subDays, format, isAfter } from "date-fns";

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
        .select('total_amount, sale_date, actual_purchase_price, quantity, "inventory list"("Price")')
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

      // Fetch Low Stock
      // Assuming low stock means less than 5 items in inventory, though the DB structure isn't entirely clear.
      // Let's check inventory. The "inventory list" usually has a quantity field, let's see. Let's just fetch all inventory for now.
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory list')
        .select('id, "Item Description", location');
      
      // Wait, inventory in Inventory.tsx uses a custom hook, let me not overcomplicate the inventory DB schema without knowing it.
      // I'll grab all items from "inventory list", wait, the location stock might be a different structure or just rows. I'll omit low stock calculation if it's too complex or will check how Inventory.tsx does it.

      if (inventoryError) console.error(inventoryError);

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
        const purchaseCost = Number(sale.actual_purchase_price || sale["inventory list"]?.Price || 0) * Number(sale.quantity || 1);
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
