import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format, getMonth, getYear } from "date-fns";
import { 
  CalendarRange, 
  ChevronDown, 
  ChevronRight, 
  FileSpreadsheet, 
  Receipt, 
  BarChart3,
  ArrowUpDown,
  History
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { safeParseDate } from "@/utils/dateParsing";
import { Sale } from "./types";

const DEFAULT_BRANCHES = ["Ikeja", "Lekki", "Abuja", "Port Harcourt"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface MonthBranchRow {
  monthIndex: number;
  monthName: string;
  branchAmounts: Record<string, number>;
  branchOrders: Record<string, number>;
  totalAmount: number;
  orderCount: number;
  unitCount: number;
}

interface YearSummaryGroup {
  year: number;
  months: MonthBranchRow[];
  branchTotals: Record<string, number>;
  totalAmount: number;
  orderCount: number;
  unitCount: number;
  activeMonthsCount: number;
}

interface SalesSummaryTableProps {
  sales: Sale[];
  filteredSales?: Sale[];
  hasActiveFilters?: boolean;
  onSwitchView?: (view: 'transactions' | 'monthly' | 'chart') => void;
}

export function SalesSummaryTable({
  sales,
  filteredSales,
  hasActiveFilters = false,
  onSwitchView,
}: SalesSummaryTableProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [monthMode, setMonthMode] = useState<"all_12" | "active_only">("all_12");
  const [monthOrder, setMonthOrder] = useState<"current_first" | "calendar">("current_first");
  const [dataScope, setDataScope] = useState<"all_sales" | "filtered">("all_sales");
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});

  const activeSales =
    hasActiveFilters && dataScope === "filtered" && filteredSales
      ? filteredSales
      : sales;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const {
    branches,
    yearGroups,
    allYearsBranchTotals,
    allYearsTotalAmount,
    allYearsOrderCount,
  } = useMemo(() => {
    // 1. Collect all branches & all observed years
    const extraBranchesSet = new Set<string>();
    const saleYearsSet = new Set<number>();

    // Index: `${year}__${monthIndex}__${location}` -> { amount, orders, units }
    const bucketMap = new Map<
      string,
      { amount: number; orders: number; units: number }
    >();

    for (const sale of activeSales) {
      const parsedDate = safeParseDate(sale.sale_date);
      if (!parsedDate) continue;

      const year = getYear(parsedDate);
      const monthIndex = getMonth(parsedDate);
      const branch = (sale.location || "Unknown Location").trim() || "Unknown Location";

      // Only track years in a reasonable range
      if (year >= 1990 && year <= 2100) {
        saleYearsSet.add(year);
      }
      
      if (!DEFAULT_BRANCHES.includes(branch)) {
        extraBranchesSet.add(branch);
      }

      const key = `${year}__${monthIndex}__${branch}`;
      const existing = bucketMap.get(key) || { amount: 0, orders: 0, units: 0 };
      existing.amount += Number(sale.total_amount || 0);
      existing.orders += 1;
      existing.units += Number(sale.quantity || 0);
      bucketMap.set(key, existing);
    }

    const orderedBranches = [
      ...DEFAULT_BRANCHES,
      ...Array.from(extraBranchesSet).sort((a, b) => a.localeCompare(b)),
    ];

    // Guarantee that recent years (currentYear, currentYear - 1, currentYear - 2) are always represented
    // even if the active filters currently have 0 sales in that year, alongside any historical years found
    saleYearsSet.add(currentYear);
    saleYearsSet.add(currentYear - 1);
    saleYearsSet.add(currentYear - 2);

    const sortedYears = Array.from(saleYearsSet).sort((a, b) => b - a);

    const crossYearBranchTotals: Record<string, number> = {};
    for (const b of orderedBranches) {
      crossYearBranchTotals[b] = 0;
    }
    let crossYearTotal = 0;
    let crossYearOrders = 0;

    const groups: YearSummaryGroup[] = sortedYears.map((year) => {
      const yearBranchTotals: Record<string, number> = {};
      for (const b of orderedBranches) {
        yearBranchTotals[b] = 0;
      }

      let yearTotalAmount = 0;
      let yearOrderCount = 0;
      let yearUnitCount = 0;
      let activeMonthsCount = 0;

      // Determine month ordering based on monthOrder preference
      let orderedIndices: number[];
      if (monthOrder === "calendar") {
        orderedIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      } else {
        // current_first:
        // For current year: Start with current month and go backward to January, followed by any future months
        if (year === currentYear) {
          const pastAndCurrent: number[] = [];
          for (let m = currentMonthIndex; m >= 0; m--) {
            pastAndCurrent.push(m);
          }
          const futureMonths: number[] = [];
          for (let m = 11; m > currentMonthIndex; m--) {
            futureMonths.push(m);
          }
          orderedIndices = [...pastAndCurrent, ...futureMonths];
        } else {
          // For previous years: December down to January (newest first)
          orderedIndices = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
        }
      }

      const months: MonthBranchRow[] = orderedIndices.map((monthIndex) => {
        const monthName = MONTH_NAMES[monthIndex];
        const branchAmounts: Record<string, number> = {};
        const branchOrders: Record<string, number> = {};
        let monthTotal = 0;
        let monthOrders = 0;
        let monthUnits = 0;

        for (const branch of orderedBranches) {
          const bucket = bucketMap.get(`${year}__${monthIndex}__${branch}`);
          const amt = bucket ? bucket.amount : 0;
          const ord = bucket ? bucket.orders : 0;
          const unt = bucket ? bucket.units : 0;

          branchAmounts[branch] = amt;
          branchOrders[branch] = ord;
          monthTotal += amt;
          monthOrders += ord;
          monthUnits += unt;

          yearBranchTotals[branch] += amt;
          crossYearBranchTotals[branch] += amt;
        }

        if (monthOrders > 0) {
          activeMonthsCount += 1;
        }

        yearTotalAmount += monthTotal;
        yearOrderCount += monthOrders;
        yearUnitCount += monthUnits;

        return {
          monthIndex,
          monthName,
          branchAmounts,
          branchOrders,
          totalAmount: monthTotal,
          orderCount: monthOrders,
          unitCount: monthUnits,
        };
      });

      crossYearTotal += yearTotalAmount;
      crossYearOrders += yearOrderCount;

      return {
        year,
        months,
        branchTotals: yearBranchTotals,
        totalAmount: yearTotalAmount,
        orderCount: yearOrderCount,
        unitCount: yearUnitCount,
        activeMonthsCount,
      };
    });

    return {
      branches: orderedBranches,
      yearGroups: groups,
      allYearsBranchTotals: crossYearBranchTotals,
      allYearsTotalAmount: crossYearTotal,
      allYearsOrderCount: crossYearOrders,
    };
  }, [activeSales, currentYear, currentMonthIndex, monthOrder]);

  const visibleYearGroups = useMemo(() => {
    if (selectedYear === "all") return yearGroups;
    const yr = Number(selectedYear);
    return yearGroups.filter((g) => g.year === yr);
  }, [yearGroups, selectedYear]);

  const toggleYearCollapse = (year: number) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const handleExportSummaryCsv = () => {
    const headers = [
      "Year",
      "Month",
      ...branches,
      "Orders",
      "Units Sold",
      "Monthly Total (NGN)",
    ];

    const rows: (string | number)[][] = [];
    for (const group of visibleYearGroups) {
      const monthsToExport =
        monthMode === "active_only"
          ? group.months.filter((m) => m.orderCount > 0)
          : group.months;

      for (const m of monthsToExport) {
        rows.push([
          group.year,
          m.monthName,
          ...branches.map((b) => m.branchAmounts[b] || 0),
          m.orderCount,
          m.unitCount,
          m.totalAmount,
        ]);
      }

      rows.push([
        group.year,
        `Annual Total (${group.year})`,
        ...branches.map((b) => group.branchTotals[b] || 0),
        group.orderCount,
        group.unitCount,
        group.totalAmount,
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((r) =>
          r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Monthly_Branch_Sales_Summary_${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const minYear =
    yearGroups.length > 0 ? yearGroups[yearGroups.length - 1].year : currentYear;
  const maxYear = yearGroups.length > 0 ? yearGroups[0].year : currentYear;
  const yearsLabel =
    minYear === maxYear ? `${maxYear}` : `${minYear}–${maxYear}`;

  return (
    <section
      aria-labelledby="monthly-branch-summary-heading"
      className="space-y-4 pt-1"
    >
      {/* Top Navigation Banner: View switcher and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/70 border border-border/80 rounded-xl px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary shrink-0" />
          <h2
            id="monthly-branch-summary-heading"
            className="text-sm sm:text-base font-bold tracking-tight text-foreground"
          >
            Monthly &amp; Branch Summary
          </h2>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            · {yearGroups.length} {yearGroups.length === 1 ? "year" : "years"} ({yearsLabel})
          </span>
        </div>

        {onSwitchView && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground hidden lg:inline mr-1">Switch view:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSwitchView('transactions')}
              className="h-7 sm:h-8 px-2.5 text-xs font-medium bg-background hover:bg-muted cursor-pointer gap-1.5"
            >
              <Receipt className="h-3.5 w-3.5 text-primary" />
              <span>Transactions Ledger</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSwitchView('chart')}
              className="h-7 sm:h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer gap-1"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Analytics</span>
            </Button>
          </div>
        )}
      </div>

      {/* Section Subtitle & Interactive Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-muted/20 border border-border/60 rounded-xl p-3">
        <div>
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Multi-year revenue matrix across branches and calendar months
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">
            {allYearsOrderCount.toLocaleString()} total orders recorded across {branches.length} branches · Total: {formatCurrency(allYearsTotalAmount)}
          </p>
        </div>

        {/* Filter & Display Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Ordering Toggle (Current Month First vs Calendar Order) */}
          <div
            className="inline-flex items-center p-0.5 rounded-lg bg-background border border-border/70 shadow-2xs"
            role="group"
            aria-label="Month ordering"
          >
            <button
              type="button"
              onClick={() => setMonthOrder("current_first")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1 ${
                monthOrder === "current_first"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Start with Current Month (e.g. November down to January)"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>Current Month First</span>
            </button>
            <button
              type="button"
              onClick={() => setMonthOrder("calendar")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                monthOrder === "calendar"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Display in traditional calendar order (January to December)"
            >
              <span>Jan → Dec</span>
            </button>
          </div>

          {/* Filtered vs All Sales Scope Toggle (only when page filters are active) */}
          {hasActiveFilters && filteredSales && (
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-background border border-border/70 shadow-2xs"
              role="group"
              aria-label="Summary data scope"
            >
              <button
                type="button"
                onClick={() => setDataScope("all_sales")}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  dataScope === "all_sales"
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Sales
              </button>
              <button
                type="button"
                onClick={() => setDataScope("filtered")}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  dataScope === "filtered"
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Filtered ({filteredSales.length})
              </button>
            </div>
          )}

          {/* Year Selector */}
          {yearGroups.length > 1 && (
            <div
              className="inline-flex items-center p-0.5 rounded-lg bg-background border border-border/70 shadow-2xs overflow-x-auto max-w-full"
              role="group"
              aria-label="Filter by year"
            >
              <button
                type="button"
                onClick={() => setSelectedYear("all")}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedYear === "all"
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Years
              </button>
              {yearGroups.map((g) => (
                <button
                  key={g.year}
                  type="button"
                  onClick={() => setSelectedYear(String(g.year))}
                  className={`px-2 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                    selectedYear === String(g.year)
                      ? "bg-secondary text-secondary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {g.year}
                </button>
              ))}
            </div>
          )}

          {/* All 12 Months vs Active Months Toggle */}
          <div
            className="inline-flex items-center p-0.5 rounded-lg bg-background border border-border/70 shadow-2xs"
            role="group"
            aria-label="Month visibility"
          >
            <button
              type="button"
              onClick={() => setMonthMode("all_12")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                monthMode === "all_12"
                  ? "bg-secondary text-secondary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All 12 Months
            </button>
            <button
              type="button"
              onClick={() => setMonthMode("active_only")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                monthMode === "active_only"
                  ? "bg-secondary text-secondary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active Months
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportSummaryCsv}
            className="h-7 sm:h-8 px-2.5 rounded-lg text-xs font-medium bg-background hover:bg-muted whitespace-nowrap shrink-0 cursor-pointer"
            title="Download Monthly & Branch Summary as CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {yearGroups.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No recorded sales available to summarize across months and branches yet.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Year-by-Year Cards */}
          {visibleYearGroups.map((group) => {
            const isCollapsed = Boolean(collapsedYears[group.year]);
            const displayedMonths =
              monthMode === "active_only"
                ? group.months.filter((m) => m.orderCount > 0)
                : group.months;

            return (
              <div
                key={group.year}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs"
              >
                {/* Year Header Accordion */}
                <button
                  type="button"
                  onClick={() => toggleYearCollapse(group.year)}
                  className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex flex-wrap items-center justify-between gap-2 text-left cursor-pointer"
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-bold text-sm sm:text-base text-foreground">
                      Fiscal Year {group.year}
                    </span>
                    {group.year === currentYear && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-semibold text-primary">
                        Current Year
                      </span>
                    )}
                    {group.year < currentYear && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-2xs font-medium text-muted-foreground">
                        <History className="h-3 w-3" />
                        Previous Year
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">
                      · {group.activeMonthsCount}/12 months active ·{" "}
                      {group.orderCount.toLocaleString()}{" "}
                      {group.orderCount === 1 ? "sale" : "sales"}
                    </span>
                  </div>

                  <div className="text-right font-mono font-bold text-sm sm:text-base text-foreground tabular-nums">
                    {formatCurrency(group.totalAmount)}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-border/70">
                    {/* Desktop Matrix Table: All Months x All Branches */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/20">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[170px] text-xs font-semibold text-muted-foreground">
                              Month ({monthOrder === "current_first" ? "Current First" : "Jan–Dec"})
                            </TableHead>
                            {branches.map((branch) => (
                              <TableHead
                                key={branch}
                                className="text-right text-xs font-semibold text-muted-foreground whitespace-nowrap"
                              >
                                {branch}
                              </TableHead>
                            ))}
                            <TableHead className="w-[85px] text-right text-xs font-semibold text-muted-foreground">
                              Orders
                            </TableHead>
                            <TableHead className="w-[165px] text-right text-xs font-semibold text-muted-foreground">
                              Monthly Total
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {displayedMonths.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={branches.length + 3}
                                className="py-6 text-center text-xs text-muted-foreground"
                              >
                                No sales recorded in {group.year}.
                              </TableCell>
                            </TableRow>
                          ) : (
                            displayedMonths.map((m) => {
                              const isCurrentMonth =
                                group.year === currentYear &&
                                m.monthIndex === currentMonthIndex;

                              return (
                                <TableRow
                                  key={`${group.year}-${m.monthIndex}`}
                                  className={`hover:bg-muted/35 transition-colors ${
                                    isCurrentMonth ? "bg-primary/[0.04] font-medium" : ""
                                  }`}
                                >
                                  <TableCell className="py-2.5 font-medium text-foreground whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      <span>{m.monthName}</span>
                                      {isCurrentMonth && (
                                        <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.2 text-2xs font-semibold text-primary">
                                          Current Month
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>

                                  {branches.map((branch) => {
                                    const amt = m.branchAmounts[branch] || 0;
                                    return (
                                      <TableCell
                                        key={branch}
                                        className={`py-2.5 text-right font-mono tabular-nums text-xs sm:text-sm ${
                                          amt > 0
                                            ? "text-foreground font-medium"
                                            : "text-muted-foreground/40"
                                        }`}
                                      >
                                        {formatCurrency(amt)}
                                      </TableCell>
                                    );
                                  })}

                                  <TableCell
                                    className={`py-2.5 text-right font-mono tabular-nums text-xs ${
                                      m.orderCount > 0
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground/40"
                                    }`}
                                  >
                                    {m.orderCount}
                                  </TableCell>

                                  <TableCell
                                    className={`py-2.5 text-right font-mono tabular-nums font-semibold ${
                                      m.totalAmount > 0
                                        ? "text-foreground"
                                        : "text-muted-foreground/40"
                                    }`}
                                  >
                                    {formatCurrency(m.totalAmount)}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}

                          {/* Annual Total Row */}
                          <TableRow className="bg-muted/35 hover:bg-muted/40 border-t border-border font-semibold">
                            <TableCell className="py-3 font-bold text-foreground whitespace-nowrap">
                              {group.year} Fiscal Total
                            </TableCell>
                            {branches.map((branch) => {
                              const bTotal = group.branchTotals[branch] || 0;
                              return (
                                <TableCell
                                  key={branch}
                                  className="py-3 text-right font-mono tabular-nums font-semibold text-foreground"
                                >
                                  {formatCurrency(bTotal)}
                                </TableCell>
                              );
                            })}
                            <TableCell className="py-3 text-right font-mono tabular-nums font-bold text-foreground">
                              {group.orderCount.toLocaleString()}
                            </TableCell>
                            <TableCell className="py-3 text-right font-mono tabular-nums font-bold text-primary">
                              {formatCurrency(group.totalAmount)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Stacked List: Branch Totals + All Months */}
                    <div className="md:hidden divide-y divide-border/60">
                      {/* Year Branch Breakdown Strip */}
                      <div className="px-3.5 py-3 bg-muted/15">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">
                          {group.year} Branch Breakdown
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 border-t border-border/50">
                          {branches.map((branch) => (
                            <div
                              key={branch}
                              className="flex items-baseline justify-between gap-2 min-w-0 py-0.5"
                            >
                              <span className="text-xs text-muted-foreground truncate">
                                {branch}
                              </span>
                              <span className="text-xs font-mono font-semibold text-foreground tabular-nums shrink-0">
                                {formatCurrency(group.branchTotals[branch] || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Month Rows */}
                      {displayedMonths.length === 0 ? (
                        <div className="p-5 text-center text-xs text-muted-foreground">
                          No sales recorded in {group.year}.
                        </div>
                      ) : (
                        displayedMonths.map((m) => {
                          const isCurrentMonth =
                            group.year === currentYear &&
                            m.monthIndex === currentMonthIndex;
                          const activeMonthBranches = branches.filter(
                            (b) => (m.branchAmounts[b] || 0) > 0
                          );

                          return (
                            <div
                              key={`${group.year}-${m.monthIndex}-mobile`}
                              className={`px-3.5 py-2.5 space-y-1.5 ${
                                isCurrentMonth ? "bg-primary/[0.04]" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-sm font-semibold text-foreground">
                                    {m.monthName}
                                  </span>
                                  {isCurrentMonth && (
                                    <span className="rounded bg-primary/10 px-1.5 py-0.2 text-2xs font-semibold text-primary">
                                      Current
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground font-mono tabular-nums">
                                    · {m.orderCount}{" "}
                                    {m.orderCount === 1 ? "sale" : "sales"}
                                  </span>
                                </div>

                                <span
                                  className={`text-sm font-mono font-bold tabular-nums shrink-0 ${
                                    m.totalAmount > 0
                                      ? "text-foreground"
                                      : "text-muted-foreground/50"
                                  }`}
                                >
                                  {formatCurrency(m.totalAmount)}
                                </span>
                              </div>

                              {activeMonthBranches.length > 0 && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-border/40 text-xs">
                                  {activeMonthBranches.map((branch) => (
                                    <div
                                      key={branch}
                                      className="flex items-center justify-between gap-1.5 min-w-0"
                                    >
                                      <span className="text-muted-foreground truncate">
                                        {branch}
                                      </span>
                                      <span className="font-mono font-medium text-foreground tabular-nums shrink-0">
                                        {formatCurrency(m.branchAmounts[branch])}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Cross-Year Combined Summary Bar when viewing multiple years */}
          {selectedYear === "all" && yearGroups.length > 1 && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
              <div className="px-4 py-3 bg-muted/35 border-b border-border/70 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Combined All-Years Branch Summary ({yearsLabel})
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono tabular-nums">
                    Cumulative revenue across all {yearGroups.length} years ·{" "}
                    {allYearsOrderCount.toLocaleString()} orders
                  </p>
                </div>
                <span className="font-mono font-bold text-base text-primary tabular-nums">
                  {formatCurrency(allYearsTotalAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                {branches.map((branch) => {
                  const totalForBranch = allYearsBranchTotals[branch] || 0;
                  const sharePct =
                    allYearsTotalAmount > 0
                      ? (totalForBranch / allYearsTotalAmount) * 100
                      : 0;

                  return (
                    <div key={branch} className="p-3.5 space-y-1">
                      <div className="text-xs font-medium text-muted-foreground truncate">
                        {branch}
                      </div>
                      <div className="text-sm sm:text-base font-mono font-bold text-foreground tabular-nums">
                        {formatCurrency(totalForBranch)}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground tabular-nums">
                        {sharePct.toFixed(1)}% of all-time revenue
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
