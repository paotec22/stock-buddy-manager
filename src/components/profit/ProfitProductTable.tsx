import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/formatters";
import {
  Search,
  Pencil,
  PlusCircle,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import type { ProductProfitRow } from "@/utils/profitUtils";

interface ProfitProductTableProps {
  products: ProductProfitRow[];
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  onEditCost: (product: ProductProfitRow) => void;
}

type SortField =
  | "itemName"
  | "totalQuantity"
  | "avgSalePrice"
  | "unitCost"
  | "totalRevenue"
  | "totalCost"
  | "totalGrossProfit"
  | "marginPct";

export function ProfitProductTable({
  products,
  activeTab,
  onActiveTabChange,
  onEditCost,
}: ProfitProductTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("totalGrossProfit");
  const [sortAsc, setSortAsc] = useState(false);

  // Counts for tabs
  const uncostedCount = useMemo(
    () => products.filter((p) => !p.hasCost).length,
    [products]
  );
  const lowMarginCount = useMemo(
    () => products.filter((p) => p.hasCost && p.marginPct < 15).length,
    [products]
  );

  // Filter based on active tab & search
  const filteredProducts = useMemo(() => {
    let list = products;

    // Filter by Tab
    if (activeTab === "needs_cost") {
      list = list.filter((p) => !p.hasCost);
    } else if (activeTab === "top_drivers") {
      list = list.filter((p) => p.hasCost && p.totalGrossProfit > 0);
    } else if (activeTab === "low_margin") {
      list = list.filter((p) => p.hasCost && p.marginPct < 15);
    }

    // Filter by Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.itemName.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    // Sort
    const sorted = [...list].sort((a, b) => {
      const valA: any = a[sortField];
      const valB: any = b[sortField];

      if (typeof valA === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return sorted;
  }, [products, activeTab, searchTerm, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for numbers
    }
  };

  return (
    <Card className="rounded-2xl border-border/80 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold">
              Product-Level Profitability & Unit Economics
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Individual product revenue, unit costs, profit margins, and cost status
            </p>
          </div>

          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product or location..."
              className="pl-9 h-9 rounded-xl text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
          <TabsList className="h-9 p-1 bg-muted/60 rounded-xl grid grid-cols-2 sm:flex sm:w-auto gap-1">
            <TabsTrigger
              value="all"
              className="rounded-lg text-xs font-medium min-h-[28px]"
            >
              All Products ({products.length})
            </TabsTrigger>
            <TabsTrigger
              value="needs_cost"
              className="rounded-lg text-xs font-medium min-h-[28px] relative"
            >
              Needs Cost
              {uncostedCount > 0 && (
                <Badge
                  variant="outline"
                  className="ml-1.5 h-4 px-1 text-[10px] bg-amber-500 text-white border-none font-bold"
                >
                  {uncostedCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="top_drivers"
              className="rounded-lg text-xs font-medium min-h-[28px] hidden sm:inline-flex"
            >
              ⭐ Top Profit Drivers
            </TabsTrigger>
            <TabsTrigger
              value="low_margin"
              className="rounded-lg text-xs font-medium min-h-[28px] hidden sm:inline-flex"
            >
              📉 Low / Negative Margin ({lowMarginCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[900px]">
            <thead>
              <tr className="border-y border-border/80 bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                <th
                  onClick={() => handleSort("itemName")}
                  className="text-left py-3 px-4 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center gap-1">
                    Product Description
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("totalQuantity")}
                  className="text-right py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center justify-end gap-1">
                    Qty Sold
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("avgSalePrice")}
                  className="text-right py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center justify-end gap-1">
                    Avg Sale Price
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("unitCost")}
                  className="text-right py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center justify-end gap-1">
                    Unit Cost (COGS)
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th className="text-right py-3 px-3">
                  Profit / Unit
                </th>
                <th
                  onClick={() => handleSort("totalRevenue")}
                  className="text-right py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Revenue
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("totalGrossProfit")}
                  className="text-right py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center justify-end gap-1">
                    Total Profit
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("marginPct")}
                  className="text-center py-3 px-3 cursor-pointer hover:text-foreground"
                >
                  <div className="flex items-center justify-center gap-1">
                    Margin %
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </div>
                </th>
                <th className="text-center py-3 px-4">Cost Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                    No products found matching your current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isProfitable = p.totalGrossProfit >= 0;
                  return (
                    <tr
                      key={p.key}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      {/* Product Name & Location */}
                      <td className="py-3 px-4 font-medium">
                        <div className="font-semibold text-foreground max-w-[240px] truncate">
                          {p.itemName}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{p.location}</span>
                          {p.receivables > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-mono">
                              ({formatCurrency(p.receivables)} uncollected)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Qty Sold */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                        {p.totalQuantity}
                      </td>

                      {/* Avg Sale Price */}
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(p.avgSalePrice)}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3 px-3 text-right">
                        {p.hasCost ? (
                          <button
                            type="button"
                            onClick={() => onEditCost(p)}
                            className="inline-flex items-center gap-1 font-mono font-medium text-primary hover:underline hover:bg-primary/10 px-1.5 py-0.5 rounded transition-all"
                            title="Click to edit unit cost"
                          >
                            <span>{formatCurrency(p.unitCost)}</span>
                            <Pencil className="h-3 w-3 opacity-60" />
                          </button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onEditCost(p)}
                            className="h-7 text-xs rounded-lg border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-medium px-2"
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Set Cost
                          </Button>
                        )}
                      </td>

                      {/* Profit Per Unit */}
                      <td className="py-3 px-3 text-right font-mono">
                        {p.hasCost ? (
                          <span
                            className={
                              p.profitPerUnit >= 0
                                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                : "text-destructive font-medium"
                            }
                          >
                            {formatCurrency(p.profitPerUnit)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            Cost pending
                          </span>
                        )}
                      </td>

                      {/* Total Revenue */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                        {formatCurrency(p.totalRevenue)}
                      </td>

                      {/* Total Profit */}
                      <td className="py-3 px-3 text-right font-mono">
                        {p.hasCost ? (
                          <span
                            className={`font-bold ${
                              isProfitable
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {formatCurrency(p.totalGrossProfit)}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-xs font-mono">
                            Pending Cost
                          </span>
                        )}
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-3 text-center">
                        {p.hasCost ? (
                          <Badge
                            variant="outline"
                            className={`font-mono text-[11px] font-semibold ${
                              p.marginPct >= 30
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : p.marginPct >= 15
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                : p.marginPct >= 0
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}
                          >
                            {p.marginPct.toFixed(1)}%
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-muted text-muted-foreground border-border/80"
                          >
                            Uncalculated
                          </Badge>
                        )}
                      </td>

                      {/* Action / Cost Status */}
                      <td className="py-3 px-4 text-center">
                        {p.hasCost ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Costed
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditCost(p)}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit purchase cost"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditCost(p)}
                            className="h-7 text-xs rounded-lg border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-medium px-2"
                          >
                            Set Cost
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
