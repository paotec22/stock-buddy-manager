import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  format, 
  isWithinInterval, 
  startOfMonth, 
  endOfMonth, 
  subMonths 
} from "date-fns";
import { getItemCostCache } from "@/utils/profitUtils";

export type DashboardTimeRange = 'today' | '7d' | '30d' | 'month' | 'all';

export interface DashboardMetricsFilter {
  timeRange: DashboardTimeRange;
  location: string;
}

export interface RecentSaleItem {
  id: number;
  itemName: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  saleDate: string;
  location?: string;
  notes?: string | null;
}

export interface RecentInvoiceItem {
  id: number;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  invoiceDate: string;
  dueDate?: string | null;
}

export interface LowStockItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  location: string;
  unitsSold30d?: number;
  runwayDays?: number | null;
  recommendedReorder?: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface PaymentStatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

export interface DashboardData {
  totalRevenue: number;
  previousRevenue: number;
  revenueGrowthPct: number | null;
  totalSalesCount: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  
  netProfit: number;
  grossProfit: number;
  profitMarginPct: number;
  
  totalExpenses: number;
  
  inventoryValuation: number;
  totalStockUnits: number;
  totalSkus: number;
  lowStockItems: LowStockItem[];
  outOfStockCount: number;
  availableLocations: string[];
  
  totalInvoicesCount: number;
  totalInvoicedAmount: number;
  recentInvoices: RecentInvoiceItem[];
  
  recentSales: RecentSaleItem[];
  pendingInstallationsCount: number;
  
  paymentBreakdown: PaymentStatusBreakdown[];
  chartData: ChartDataPoint[];

  stockRunwaySummary: {
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
  };
  queryDurationMs?: number;
}

export const useDashboardData = (filters: DashboardMetricsFilter = { timeRange: '30d', location: 'all' }) => {
  const { session } = useAuth();
  const { timeRange, location } = filters;

  return useQuery<DashboardData>({
    queryKey: ['dashboard-metrics', timeRange, location],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = endOfDay(now);
      let prevStartDate: Date;
      let prevEndDate: Date;

      if (timeRange === 'today') {
        startDate = startOfDay(now);
        prevStartDate = startOfDay(subDays(now, 1));
        prevEndDate = endOfDay(subDays(now, 1));
      } else if (timeRange === '7d') {
        startDate = startOfDay(subDays(now, 6));
        prevStartDate = startOfDay(subDays(now, 13));
        prevEndDate = endOfDay(subDays(now, 7));
      } else if (timeRange === 'month') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        prevStartDate = startOfMonth(subMonths(now, 1));
        prevEndDate = endOfMonth(subMonths(now, 1));
      } else if (timeRange === 'all') {
        startDate = new Date(2020, 0, 1);
        prevStartDate = new Date(2019, 0, 1);
        prevEndDate = new Date(2019, 11, 31);
      } else {
        // default: 30d
        startDate = startOfDay(subDays(now, 29));
        prevStartDate = startOfDay(subDays(now, 59));
        prevEndDate = endOfDay(subDays(now, 30));
      }

      const startTime = performance.now();
      const costCache = getItemCostCache();

      // Parallel execution of all database queries for ultra-low latency & maximum speed
      const [
        { data: rawSales, error: salesError },
        { data: rawExpenses, error: expensesError },
        { data: rawInventory, error: inventoryError },
        { data: rawInvoices, error: invoicesError },
        { data: pendingInstallations, error: installationsError }
      ] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            id,
            total_amount,
            sale_price,
            quantity,
            actual_purchase_price,
            sale_date,
            payment_status,
            amount_paid,
            notes,
            item_id,
            "inventory list" (
              "Item Description",
              location
            )
          `)
          .order('sale_date', { ascending: false }),

        supabase
          .from('expenses')
          .select('id, amount, category, description, expense_date, location')
          .order('expense_date', { ascending: false }),

        supabase
          .from('inventory list')
          .select('id, "Item Description", location, Price, Quantity, Total'),

        supabase
          .from('invoices')
          .select('id, invoice_number, customer_name, total_amount, invoice_date, due_date, created_at')
          .order('created_at', { ascending: false }),

        supabase
          .from('installation_requests')
          .select('id, status, location')
          .eq('status', 'Not installed')
      ]);

      if (salesError) throw salesError;
      if (expensesError) throw expensesError;
      if (inventoryError) throw inventoryError;
      if (invoicesError) throw invoicesError;
      if (installationsError) throw installationsError;

      // Filter Inventory by location
      const inventory = (rawInventory || []).filter(item => {
        if (location === 'all') return true;
        return item.location?.toLowerCase() === location.toLowerCase();
      });

      // Available locations extracted from inventory
      const locationSet = new Set<string>();
      (rawInventory || []).forEach(item => {
        if (item.location) locationSet.add(item.location);
      });
      const availableLocations = Array.from(locationSet).sort();

      // Filter Sales by location
      const sales = (rawSales || []).filter((sale: any) => {
        if (location === 'all') return true;
        const itemLoc = sale["inventory list"]?.location;
        return itemLoc && itemLoc.toLowerCase() === location.toLowerCase();
      });

      // Filter Expenses by location
      const expenses = (rawExpenses || []).filter(exp => {
        if (location === 'all') return true;
        return exp.location && exp.location.toLowerCase() === location.toLowerCase();
      });

      // Calculate Sales metrics within active range & previous range
      let totalRevenue = 0;
      let previousRevenue = 0;
      let totalSalesCount = 0;
      let totalUnitsSold = 0;
      let totalCOGS = 0;

      const paymentMap = new Map<string, { count: number; amount: number }>();
      const recentSales: RecentSaleItem[] = [];

      sales.forEach((sale: any) => {
        const saleDateStr = sale.sale_date;
        if (!saleDateStr) return;
        const saleDate = new Date(saleDateStr);
        const amount = Number(sale.total_amount || 0);
        const qty = Number(sale.quantity || 1);
        const itemId = sale.item_id ? String(sale.item_id) : "";
        const cachedCost = itemId && costCache[itemId] ? costCache[itemId] : 0;
        const unitCost = Number(sale.actual_purchase_price || cachedCost || 0);

        // Check if in active interval
        if (isWithinInterval(saleDate, { start: startDate, end: endDate })) {
          totalRevenue += amount;
          totalSalesCount += 1;
          totalUnitsSold += qty;
          totalCOGS += unitCost * qty;

          // Payment status aggregation
          const rawStatus = (sale.payment_status || 'Paid').trim();
          const currentPm = paymentMap.get(rawStatus) || { count: 0, amount: 0 };
          paymentMap.set(rawStatus, {
            count: currentPm.count + 1,
            amount: currentPm.amount + amount
          });
        }

        // Check if in previous interval for growth comparison
        if (isWithinInterval(saleDate, { start: prevStartDate, end: prevEndDate })) {
          previousRevenue += amount;
        }

        // Collect top recent sales (overall most recent)
        if (recentSales.length < 8) {
          recentSales.push({
            id: sale.id,
            itemName: sale["inventory list"]?.["Item Description"] || "Unspecified item",
            quantity: qty,
            totalAmount: amount,
            paymentStatus: sale.payment_status || "Paid",
            saleDate: saleDateStr,
            location: sale["inventory list"]?.location,
            notes: sale.notes
          });
        }
      });

      // Calculate revenue growth percentage
      let revenueGrowthPct: number | null = null;
      if (previousRevenue > 0) {
        revenueGrowthPct = Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100);
      } else if (totalRevenue > 0) {
        revenueGrowthPct = 100;
      }

      const averageOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
      const grossProfit = totalRevenue - totalCOGS;

      // Expenses in active interval
      let totalExpenses = 0;
      expenses.forEach(exp => {
        if (!exp.expense_date) return;
        const expDate = new Date(exp.expense_date);
        if (isWithinInterval(expDate, { start: startDate, end: endDate })) {
          totalExpenses += Number(exp.amount || 0);
        }
      });

      const netProfit = grossProfit - totalExpenses;
      const profitMarginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

      // Compute 30-day sales velocity per item for runway forecasting
      const thirtyDaysAgo = subDays(now, 30);
      const item30dUnitsSold = new Map<number, number>();
      (rawSales || []).forEach((sale: any) => {
        if (!sale.sale_date || !sale.item_id) return;
        const sDate = new Date(sale.sale_date);
        if (sDate >= thirtyDaysAgo) {
          const prev = item30dUnitsSold.get(sale.item_id) || 0;
          item30dUnitsSold.set(sale.item_id, prev + Number(sale.quantity || 0));
        }
      });

      // Inventory valuation & low stock items with Runway Intelligence
      let inventoryValuation = 0;
      let totalStockUnits = 0;
      const totalSkus = inventory.length;
      let outOfStockCount = 0;
      let criticalRunwayCount = 0;
      let warningRunwayCount = 0;
      let healthyRunwayCount = 0;
      const lowStockItems: LowStockItem[] = [];

      inventory.forEach(item => {
        const qty = Number(item.Quantity || 0);
        const price = Number(item.Price || 0);
        const lineTotal = item.Total !== null && item.Total !== undefined ? Number(item.Total) : price * qty;
        
        inventoryValuation += lineTotal;
        totalStockUnits += qty;

        const sold30d = item30dUnitsSold.get(item.id) || 0;
        const dailyBurnRate = sold30d / 30;
        const runwayDays = dailyBurnRate > 0 ? Math.round(qty / dailyBurnRate) : (qty === 0 ? 0 : null);
        const recommendedReorder = qty <= 5 ? Math.max(10, Math.ceil(dailyBurnRate * 30 * 1.5)) : 0;

        if (qty <= 0) {
          outOfStockCount++;
          criticalRunwayCount++;
        } else if (runwayDays !== null && runwayDays <= 7) {
          criticalRunwayCount++;
        } else if ((runwayDays !== null && runwayDays <= 14) || qty <= 5) {
          warningRunwayCount++;
        } else {
          healthyRunwayCount++;
        }

        if (qty <= 5 || (runwayDays !== null && runwayDays <= 7)) {
          lowStockItems.push({
            id: item.id,
            description: item["Item Description"] || "Unnamed product",
            quantity: qty,
            price: price,
            location: item.location || "Default",
            unitsSold30d: sold30d,
            runwayDays,
            recommendedReorder
          });
        }
      });

      // Sort low stock items so 0 qty comes first, then lowest runway days
      lowStockItems.sort((a, b) => {
        if (a.quantity <= 0 && b.quantity > 0) return -1;
        if (b.quantity <= 0 && a.quantity > 0) return 1;
        const aRunway = a.runwayDays ?? 999;
        const bRunway = b.runwayDays ?? 999;
        return aRunway - bRunway || a.quantity - b.quantity;
      });

      // Invoices
      const totalInvoicesCount = (rawInvoices || []).length;
      let totalInvoicedAmount = 0;
      const recentInvoices: RecentInvoiceItem[] = [];

      (rawInvoices || []).forEach((inv, index) => {
        totalInvoicedAmount += Number(inv.total_amount || 0);
        if (index < 6) {
          recentInvoices.push({
            id: inv.id,
            invoiceNumber: inv.invoice_number || `INV-${inv.id}`,
            customerName: inv.customer_name || "Guest Customer",
            totalAmount: Number(inv.total_amount || 0),
            invoiceDate: inv.invoice_date || inv.created_at,
            dueDate: inv.due_date
          });
        }
      });

      // Pending installations count (optionally filtered by location)
      const filteredInstallations = (pendingInstallations || []).filter(item => {
        if (location === 'all') return true;
        return item.location?.toLowerCase() === location.toLowerCase();
      });

      // Format payment breakdown list
      const paymentBreakdown: PaymentStatusBreakdown[] = Array.from(paymentMap.entries()).map(
        ([status, val]) => ({
          status,
          count: val.count,
          amount: val.amount
        })
      );

      // Chart Data Generation
      const chartPointsMap = new Map<string, { revenue: number; expenses: number; profit: number }>();

      if (timeRange === 'today') {
        // Hourly buckets for today (24 hours)
        for (let h = 0; h < 24; h += 3) {
          const label = `${h.toString().padStart(2, '0')}:00`;
          chartPointsMap.set(label, { revenue: 0, expenses: 0, profit: 0 });
        }
        sales.forEach((s: any) => {
          if (!s.sale_date) return;
          const d = new Date(s.sale_date);
          if (isWithinInterval(d, { start: startDate, end: endDate })) {
            const h = Math.floor(d.getHours() / 3) * 3;
            const label = `${h.toString().padStart(2, '0')}:00`;
            const entry = chartPointsMap.get(label) || { revenue: 0, expenses: 0, profit: 0 };
            entry.revenue += Number(s.total_amount || 0);
            chartPointsMap.set(label, entry);
          }
        });
      } else {
        // Daily buckets
        const numDays = timeRange === '7d' ? 7 : timeRange === 'month' ? 30 : 30;
        for (let i = numDays - 1; i >= 0; i--) {
          const dateStr = format(subDays(now, i), 'MMM dd');
          chartPointsMap.set(dateStr, { revenue: 0, expenses: 0, profit: 0 });
        }

        sales.forEach((s: any) => {
          if (!s.sale_date) return;
          const d = new Date(s.sale_date);
          if (isWithinInterval(d, { start: startDate, end: endDate })) {
            const dateStr = format(d, 'MMM dd');
            if (chartPointsMap.has(dateStr)) {
              const entry = chartPointsMap.get(dateStr)!;
              const amt = Number(s.total_amount || 0);
              entry.revenue += amt;
            }
          }
        });

        expenses.forEach((e: any) => {
          if (!e.expense_date) return;
          const d = new Date(e.expense_date);
          if (isWithinInterval(d, { start: startDate, end: endDate })) {
            const dateStr = format(d, 'MMM dd');
            if (chartPointsMap.has(dateStr)) {
              const entry = chartPointsMap.get(dateStr)!;
              const amt = Number(e.amount || 0);
              entry.expenses += amt;
            }
          }
        });

        // Compute profit for each day
        chartPointsMap.forEach((val) => {
          val.profit = val.revenue - val.expenses;
        });
      }

      const chartData: ChartDataPoint[] = Array.from(chartPointsMap.entries()).map(([date, vals]) => ({
        date,
        revenue: Math.round(vals.revenue),
        expenses: Math.round(vals.expenses),
        profit: Math.round(vals.profit)
      }));

      const queryDurationMs = Math.round(performance.now() - startTime);

      return {
        totalRevenue,
        previousRevenue,
        revenueGrowthPct,
        totalSalesCount,
        totalUnitsSold,
        averageOrderValue,
        netProfit,
        grossProfit,
        profitMarginPct,
        totalExpenses,
        inventoryValuation,
        totalStockUnits,
        totalSkus,
        lowStockItems: lowStockItems.slice(0, 10),
        outOfStockCount,
        availableLocations,
        totalInvoicesCount,
        totalInvoicedAmount,
        recentInvoices,
        recentSales,
        pendingInstallationsCount: filteredInstallations.length,
        paymentBreakdown,
        chartData,
        stockRunwaySummary: {
          criticalCount: criticalRunwayCount,
          warningCount: warningRunwayCount,
          healthyCount: healthyRunwayCount
        },
        queryDurationMs
      };
    },
    enabled: !!session,
    refetchInterval: 30000 // auto-refresh every 30 seconds for live feel
  });
};
