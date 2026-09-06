import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { currencies } from "@/components/invoice/CurrencyChanger";
import { ProfitLoadingState } from "@/components/profit/ProfitLoadingState";
import { ProfitFilterToolbar } from "@/components/profit/ProfitFilterToolbar";
import { ProfitExecutiveCards } from "@/components/profit/ProfitExecutiveCards";
import { ProfitCostAlertBanner } from "@/components/profit/ProfitCostAlertBanner";
import { ProfitCashVsAccrualCard } from "@/components/profit/ProfitCashVsAccrualCard";
import { ProfitExpensesBreakdown } from "@/components/profit/ProfitExpensesBreakdown";
import { ProfitProductTable } from "@/components/profit/ProfitProductTable";
import { SetCostModal } from "@/components/profit/SetCostModal";
import {
  type TimeRangePreset,
  type DateRange,
  type SaleItemData,
  type ExpenseItemData,
  type ProductProfitRow,
  getDateRangeFromPreset,
  computeProfitAnalysis,
  getItemCostCache,
  setItemCostCache,
} from "@/utils/profitUtils";
import { TrendingUp, FileSpreadsheet, ShieldAlert } from "lucide-react";

const ProfitAnalysis = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Filter States
  const [preset, setPreset] = useState<TimeRangePreset>("this_month");
  const [customRange, setCustomRange] = useState<DateRange>({});
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [tableTab, setTableTab] = useState<string>("all");

  // Cost Modal State
  const [selectedProductForCost, setSelectedProductForCost] = useState<ProductProfitRow | null>(null);
  const [isCostModalOpen, setIsCostModalOpen] = useState<boolean>(false);

  // Cost Cache state
  const [costCache, setCostCache] = useState<Record<string, number>>(() => getItemCostCache());

  // 1. Fetch Sales Data with Inventory Relations
  const {
    data: rawSales = [],
    isLoading: salesLoading,
    isFetching: salesFetching,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ["salesForProfit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          quantity,
          sale_price,
          total_amount,
          sale_date,
          actual_purchase_price,
          item_id,
          payment_status,
          amount_paid,
          customer_id,
          notes,
          "inventory list" (
            id,
            "Item Description",
            Price,
            location
          )
        `)
        .order("sale_date", { ascending: false });

      if (error) {
        console.error("Error fetching sales for profit:", error);
        throw error;
      }
      return (data || []) as SaleItemData[];
    },
    enabled: !!session,
  });

  // 2. Fetch Operating Expenses
  const {
    data: rawExpenses = [],
    isLoading: expensesLoading,
    isFetching: expensesFetching,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["expensesForProfit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });

      if (error) {
        console.error("Error fetching expenses for profit:", error);
        throw error;
      }
      return (data || []) as ExpenseItemData[];
    },
    enabled: !!session,
  });

  // 3. Compute Date Range from Preset
  const dateRange = useMemo(() => {
    return getDateRangeFromPreset(preset, customRange);
  }, [preset, customRange]);

  // 4. Compute Comprehensive Profit Metrics & Product Rows
  const { metrics, productRows, locations } = useMemo(() => {
    return computeProfitAnalysis(
      rawSales,
      rawExpenses,
      dateRange,
      selectedLocation,
      costCache
    );
  }, [rawSales, rawExpenses, dateRange, selectedLocation, costCache]);

  // 5. Mutation to Set/Update Purchase Cost
  const updateCostMutation = useMutation({
    mutationFn: async ({
      product,
      newCost,
      applyToPastSales,
    }: {
      product: ProductProfitRow;
      newCost: number;
      applyToPastSales: boolean;
    }) => {
      // 1. Update database sales records
      const targetSaleIds = applyToPastSales
        ? product.saleIds
        : [product.saleIds[0]];

      if (targetSaleIds.length > 0) {
        const { error } = await supabase
          .from("sales")
          .update({ actual_purchase_price: newCost })
          .in("id", targetSaleIds);

        if (error) {
          console.error("Failed to update sales purchase price in DB:", error);
          throw error;
        }
      }

      // 2. Persist to localStorage item cost memory
      setItemCostCache(product.itemId, newCost);
      setCostCache((prev) => ({ ...prev, [String(product.itemId)]: newCost }));

      return { product, newCost, count: targetSaleIds.length };
    },
    onSuccess: ({ product, newCost, count }) => {
      toast.success(
        `Purchase cost updated to ${formatCurrency(newCost)} for ${product.itemName} (${count} sales updated)`
      );
      queryClient.invalidateQueries({ queryKey: ["salesForProfit"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (err) => {
      console.error("Error updating cost:", err);
      toast.error("Failed to update purchase cost. Please try again.");
    },
  });

  // Handlers
  const handleOpenCostModal = (product: ProductProfitRow) => {
    setSelectedProductForCost(product);
    setIsCostModalOpen(true);
  };

  const handleReviewUncosted = () => {
    setTableTab("needs_cost");
    const tableEl = document.getElementById("product-profit-table");
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchSales(), refetchExpenses()]);
    toast.success("Profit and sales data refreshed");
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    try {
      const headers = [
        "Product Description",
        "Location",
        "Quantity Sold",
        "Avg Selling Price (NGN)",
        "Unit Purchase Cost (NGN)",
        "Unit Profit (NGN)",
        "Total Revenue (NGN)",
        "Total COGS (NGN)",
        "Total Gross Profit (NGN)",
        "Gross Margin %",
        "Cash Collected (NGN)",
        "Receivables (NGN)",
        "Cost Status",
      ];

      const rows = productRows.map((p) => [
        `"${p.itemName.replace(/"/g, '""')}"`,
        `"${p.location}"`,
        p.totalQuantity,
        p.avgSalePrice.toFixed(2),
        p.unitCost.toFixed(2),
        p.profitPerUnit.toFixed(2),
        p.totalRevenue.toFixed(2),
        p.totalCost.toFixed(2),
        p.totalGrossProfit.toFixed(2),
        `${p.marginPct.toFixed(1)}%`,
        p.cashCollected.toFixed(2),
        p.receivables.toFixed(2),
        p.hasCost ? "Costed" : "Pending Cost",
      ]);

      // Summary Header block
      const summaryHeader = [
        ["PROFIT & LOSS ANALYSIS REPORT"],
        ["Generated At", format(new Date(), "yyyy-MM-dd HH:mm:ss")],
        ["Period Preset", preset],
        ["Selected Location", selectedLocation === "all" ? "All Locations" : selectedLocation],
        ["Total Revenue (NGN)", metrics.totalRevenue.toFixed(2)],
        ["Cash Collected (NGN)", metrics.cashCollected.toFixed(2)],
        ["Accounts Receivable (NGN)", metrics.accountsReceivable.toFixed(2)],
        ["Total COGS (NGN)", metrics.totalCogs.toFixed(2)],
        ["Gross Profit (NGN)", metrics.grossProfit.toFixed(2)],
        ["Gross Margin %", `${metrics.grossMarginPct.toFixed(1)}%`],
        ["Operating Expenses (NGN)", metrics.totalExpenses.toFixed(2)],
        ["Net Operating Profit (NGN)", metrics.netProfit.toFixed(2)],
        ["Net Margin %", `${metrics.netMarginPct.toFixed(1)}%`],
        [],
      ];

      const csvContent =
        "data:text/csv;charset=utf-8," +
        summaryHeader.map((e) => e.join(",")).join("\n") +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `profit-analysis-${preset}-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Profit analysis CSV downloaded");
    } catch (err) {
      console.error("Export CSV failed:", err);
      toast.error("Failed to generate CSV export");
    }
  };

  if (salesLoading || expensesLoading) {
    return <ProfitLoadingState />;
  }

  const isRefreshing = salesFetching || expensesFetching;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Profit Analysis & Unit Economics
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> Live P&L
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Accurate revenue, cost of goods sold (COGS), gross margins, operating expenses, and net profitability
          </p>
        </div>
      </div>

      {/* ── FILTER TOOLBAR ────────────────────────────────── */}
      <ProfitFilterToolbar
        preset={preset}
        onPresetChange={setPreset}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        locations={locations}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExportCsv={handleExportCsv}
      />

      {/* ── AUDIT & COST WARNING BANNER ───────────────────── */}
      <ProfitCostAlertBanner
        metrics={metrics}
        onReviewUncosted={handleReviewUncosted}
      />

      {/* ── 4 EXECUTIVE FINANCIAL CARDS ───────────────────── */}
      <ProfitExecutiveCards
        metrics={metrics}
        onViewUncosted={handleReviewUncosted}
      />

      {/* ── CASH FLOW VS BOOKED PROFIT & OPERATING EXPENSES ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ProfitCashVsAccrualCard metrics={metrics} />
        </div>
        <div className="lg:col-span-1">
          <ProfitExpensesBreakdown
            totalExpenses={metrics.totalExpenses}
            breakdown={metrics.expenseBreakdown}
          />
        </div>
      </div>

      {/* ── PRODUCT PROFITABILITY TABLE ───────────────────── */}
      <div id="product-profit-table">
        <ProfitProductTable
          products={productRows}
          activeTab={tableTab}
          onActiveTabChange={setTableTab}
          onEditCost={handleOpenCostModal}
        />
      </div>

      {/* ── MODAL: SET OR EDIT UNIT PURCHASE COST ─────────── */}
      <SetCostModal
        open={isCostModalOpen}
        onOpenChange={setIsCostModalOpen}
        product={selectedProductForCost}
        onSaveCost={async (params) => {
          await updateCostMutation.mutateAsync(params);
        }}
        isSaving={updateCostMutation.isPending}
      />
    </div>
  );
};

export default ProfitAnalysis;
