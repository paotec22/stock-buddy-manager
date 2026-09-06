import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subDays,
  startOfQuarter,
  endOfQuarter,
  isWithinInterval,
} from "date-fns";

export type TimeRangePreset =
  | "this_month"
  | "last_month"
  | "last_30_days"
  | "this_quarter"
  | "this_year"
  | "all_time"
  | "custom";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface SaleItemData {
  id: string | number;
  quantity: number;
  sale_price: number;
  total_amount: number;
  sale_date: string;
  actual_purchase_price: number | null;
  item_id: string | number | null;
  payment_status?: string | null;
  amount_paid?: number | null;
  customer_id?: string | null;
  notes?: string | null;
  "inventory list"?: {
    id?: number;
    "Item Description"?: string;
    Price?: number | null;
    location?: string;
  } | null;
}

export interface ExpenseItemData {
  id: number;
  amount: number;
  category: string;
  description?: string;
  expense_date: string;
  location?: string;
}

export interface ProductProfitRow {
  key: string;
  itemId: string | number;
  itemName: string;
  location: string;
  totalQuantity: number;
  totalRevenue: number;
  cashCollected: number;
  receivables: number;
  avgSalePrice: number;
  unitCost: number;
  hasCost: boolean;
  profitPerUnit: number;
  totalCost: number;
  totalGrossProfit: number;
  marginPct: number;
  saleIds: (string | number)[];
  costStatus: "verified" | "pending";
}

export interface ProfitExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface ProfitMetrics {
  // Revenue
  totalRevenue: number;
  cashCollected: number;
  accountsReceivable: number;
  collectionRatePct: number;

  // COGS & Gross Profit
  totalCogs: number;
  grossProfit: number;
  grossMarginPct: number;
  markupPct: number;

  // Realized Cash Profit
  cashGrossProfit: number;

  // Operating Expenses
  totalExpenses: number;
  expenseBreakdown: ProfitExpenseCategory[];

  // Net Profit
  netProfit: number;
  netMarginPct: number;

  // Audit / Data Quality
  totalSalesCount: number;
  costedSalesCount: number;
  uncostedSalesCount: number;
  uncostedRevenue: number;
  costCoveragePct: number;
  totalUnitsSold: number;
}

const LOCAL_STORAGE_COST_KEY = "si-manager-item-costs";

/**
 * Retrieve cached/default item costs saved in localStorage.
 */
export function getItemCostCache(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_COST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persist an item's default unit purchase cost to localStorage.
 */
export function setItemCostCache(itemId: string | number, cost: number): void {
  try {
    const existing = getItemCostCache();
    existing[String(itemId)] = cost;
    localStorage.setItem(LOCAL_STORAGE_COST_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save item cost to localStorage:", e);
  }
}

/**
 * Bulk persist item costs to localStorage.
 */
export function bulkSetItemCostCache(costs: Record<string, number>): void {
  try {
    const existing = getItemCostCache();
    const merged = { ...existing, ...costs };
    localStorage.setItem(LOCAL_STORAGE_COST_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error("Failed to bulk save item costs:", e);
  }
}

/**
 * Helper to compute date range from preset
 */
export function getDateRangeFromPreset(preset: TimeRangePreset, customRange?: DateRange): DateRange {
  const now = new Date();

  switch (preset) {
    case "this_month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last_month": {
      const prevMonth = subMonths(now, 1);
      return { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) };
    }
    case "last_30_days":
      return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
    case "this_quarter":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "this_year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "all_time":
      return { from: undefined, to: undefined };
    case "custom":
      return {
        from: customRange?.from ? startOfDay(customRange.from) : undefined,
        to: customRange?.to ? endOfDay(customRange.to) : undefined,
      };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

/**
 * Checks if a date string falls inside the given date range.
 */
export function isDateInRange(dateStr: string, range: DateRange): boolean {
  if (!range.from && !range.to) return true;
  if (!dateStr) return false;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    if (range.from && range.to) {
      return isWithinInterval(date, { start: range.from, end: range.to });
    }
    if (range.from) {
      return date >= range.from;
    }
    if (range.to) {
      return date <= range.to;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Derives the true unit purchase price for a sale item:
 * 1. Checks sale.actual_purchase_price if > 0
 * 2. Checks cached/known cost for this item
 * 3. Returns { unitCost, hasCost }
 * NOTE: It NEVER silently falls back to retail Price (which caused ₦0 profit)!
 */
export function resolveItemPurchasePrice(
  sale: SaleItemData,
  itemCostCache: Record<string, number>
): { unitCost: number; hasCost: boolean } {
  // If sale explicitly has an actual purchase price recorded
  if (
    sale.actual_purchase_price !== null &&
    sale.actual_purchase_price !== undefined &&
    sale.actual_purchase_price > 0
  ) {
    return { unitCost: Number(sale.actual_purchase_price), hasCost: true };
  }

  // If item ID has a known cost in cache
  const itemIdKey = sale.item_id ? String(sale.item_id) : "";
  if (itemIdKey && itemCostCache[itemIdKey] && itemCostCache[itemIdKey] > 0) {
    return { unitCost: itemCostCache[itemIdKey], hasCost: true };
  }

  // Uncosted / cost pending
  return { unitCost: 0, hasCost: false };
}

/**
 * Process raw sales and expenses into comprehensive financial metrics and grouped product rows.
 */
export function computeProfitAnalysis(
  sales: SaleItemData[],
  expenses: ExpenseItemData[],
  dateRange: DateRange,
  selectedLocation: string,
  itemCostCache: Record<string, number>
): {
  metrics: ProfitMetrics;
  productRows: ProductProfitRow[];
  locations: string[];
} {
  // 1. Gather all unique locations
  const locationSet = new Set<string>();
  sales.forEach((s) => {
    const loc = s["inventory list"]?.location;
    if (loc) locationSet.add(loc);
  });
  expenses.forEach((e) => {
    if (e.location) locationSet.add(e.location);
  });
  const locations = Array.from(locationSet).sort();

  // 2. Filter sales by date & location
  const filteredSales = sales.filter((sale) => {
    if (!isDateInRange(sale.sale_date, dateRange)) return false;

    if (selectedLocation && selectedLocation !== "all") {
      const saleLoc = sale["inventory list"]?.location;
      if (saleLoc !== selectedLocation) return false;
    }

    return true;
  });

  // 3. Filter expenses by date & location
  const filteredExpenses = expenses.filter((expense) => {
    if (!isDateInRange(expense.expense_date, dateRange)) return false;

    if (selectedLocation && selectedLocation !== "all") {
      if (expense.location && expense.location !== selectedLocation) return false;
    }

    return true;
  });

  // 4. Group sales by Product + Location
  const groupedMap: Record<string, {
    itemId: string | number;
    itemName: string;
    location: string;
    totalQuantity: number;
    totalRevenue: number;
    cashCollected: number;
    totalCost: number;
    costedQuantity: number;
    unitCost: number;
    hasCost: boolean;
    saleIds: (string | number)[];
  }> = {};

  let totalRevenue = 0;
  let cashCollected = 0;
  let totalCogs = 0;
  let costedSalesCount = 0;
  let uncostedSalesCount = 0;
  let uncostedRevenue = 0;
  let totalUnitsSold = 0;

  filteredSales.forEach((sale) => {
    const itemName = sale["inventory list"]?.["Item Description"] || "Unknown Item";
    const loc = sale["inventory list"]?.location || "General";
    const itemId = sale.item_id || sale["inventory list"]?.id || itemName;
    const key = `${itemName}__${loc}`;

    const qty = Number(sale.quantity || 0);
    const saleAmount = Number(sale.total_amount || qty * Number(sale.sale_price || 0));

    // Resolve cash collected from sale
    let paidAmount = 0;
    if (sale.payment_status === "paid") {
      paidAmount = saleAmount;
    } else if (sale.payment_status === "unpaid") {
      paidAmount = 0;
    } else {
      paidAmount = Number(sale.amount_paid != null ? sale.amount_paid : saleAmount);
    }
    // Cap paidAmount at saleAmount
    paidAmount = Math.min(paidAmount, saleAmount);

    const { unitCost, hasCost } = resolveItemPurchasePrice(sale, itemCostCache);

    totalRevenue += saleAmount;
    cashCollected += paidAmount;
    totalUnitsSold += qty;

    if (hasCost) {
      costedSalesCount++;
      totalCogs += qty * unitCost;
    } else {
      uncostedSalesCount++;
      uncostedRevenue += saleAmount;
    }

    if (!groupedMap[key]) {
      groupedMap[key] = {
        itemId,
        itemName,
        location: loc,
        totalQuantity: 0,
        totalRevenue: 0,
        cashCollected: 0,
        totalCost: 0,
        costedQuantity: 0,
        unitCost: unitCost,
        hasCost: hasCost,
        saleIds: [],
      };
    }

    const grp = groupedMap[key];
    grp.totalQuantity += qty;
    grp.totalRevenue += saleAmount;
    grp.cashCollected += paidAmount;
    grp.saleIds.push(sale.id);

    if (hasCost) {
      grp.totalCost += qty * unitCost;
      grp.costedQuantity += qty;
      grp.hasCost = true;
      grp.unitCost = unitCost;
    }
  });

  // 5. Build ProductProfitRow list
  const productRows: ProductProfitRow[] = Object.entries(groupedMap).map(([key, grp]) => {
    const avgSalePrice = grp.totalQuantity > 0 ? grp.totalRevenue / grp.totalQuantity : 0;
    const unitCost = grp.hasCost
      ? grp.unitCost > 0
        ? grp.unitCost
        : grp.costedQuantity > 0
        ? grp.totalCost / grp.costedQuantity
        : 0
      : 0;

    const totalCost = grp.hasCost ? grp.totalCost : 0;
    const totalGrossProfit = grp.hasCost ? grp.totalRevenue - totalCost : grp.totalRevenue; // if uncosted, show full revenue until costed or 0
    const profitPerUnit = grp.hasCost ? avgSalePrice - unitCost : 0;
    const marginPct = grp.hasCost && grp.totalRevenue > 0
      ? ((grp.totalRevenue - totalCost) / grp.totalRevenue) * 100
      : 0;

    return {
      key,
      itemId: grp.itemId,
      itemName: grp.itemName,
      location: grp.location,
      totalQuantity: grp.totalQuantity,
      totalRevenue: grp.totalRevenue,
      cashCollected: grp.cashCollected,
      receivables: Math.max(0, grp.totalRevenue - grp.cashCollected),
      avgSalePrice,
      unitCost,
      hasCost: grp.hasCost,
      profitPerUnit,
      totalCost,
      totalGrossProfit: grp.hasCost ? grp.totalRevenue - totalCost : 0,
      marginPct,
      saleIds: grp.saleIds,
      costStatus: grp.hasCost ? "verified" : "pending",
    };
  });

  // Sort default: highest gross profit first
  productRows.sort((a, b) => b.totalGrossProfit - a.totalGrossProfit);

  // 6. Calculate operating expenses & categories
  const categoryMap: Record<string, number> = {};
  let totalExpenses = 0;

  filteredExpenses.forEach((exp) => {
    const amt = Number(exp.amount || 0);
    totalExpenses += amt;
    const cat = exp.category || "General";
    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
  });

  const expenseBreakdown: ProfitExpenseCategory[] = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 7. Overall financial aggregates
  const accountsReceivable = Math.max(0, totalRevenue - cashCollected);
  const collectionRatePct = totalRevenue > 0 ? (cashCollected / totalRevenue) * 100 : 100;

  // Gross profit: only on costed revenue to avoid artificial inflation, or overall revenue minus COGS
  const grossProfit = totalRevenue - totalCogs;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const markupPct = totalCogs > 0 ? (grossProfit / totalCogs) * 100 : 0;

  // Realized cash gross profit: cash collected minus proportional cost
  const cashGrossProfit = cashCollected - (totalRevenue > 0 ? totalCogs * (cashCollected / totalRevenue) : 0);

  // Net Operating Profit
  const netProfit = grossProfit - totalExpenses;
  const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const totalSalesCount = filteredSales.length;
  const costCoveragePct = totalSalesCount > 0 ? (costedSalesCount / totalSalesCount) * 100 : 100;

  const metrics: ProfitMetrics = {
    totalRevenue,
    cashCollected,
    accountsReceivable,
    collectionRatePct,
    totalCogs,
    grossProfit,
    grossMarginPct,
    markupPct,
    cashGrossProfit,
    totalExpenses,
    expenseBreakdown,
    netProfit,
    netMarginPct,
    totalSalesCount,
    costedSalesCount,
    uncostedSalesCount,
    uncostedRevenue,
    costCoveragePct,
    totalUnitsSold,
  };

  return { metrics, productRows, locations };
}
