import React from "react";
import { Package, Camera, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { StockFilter } from "./CatalogueTypes";

interface CatalogueStatsProps {
  total: number;
  withImages: number;
  inStockCount: number;
  lowStockCount: number;
  maxPrice: number;
  onlyWithImages: boolean;
  onToggleOnlyWithImages: () => void;
  stockFilter: StockFilter;
  onSetStockFilter: (filter: StockFilter) => void;
}

export function CatalogueStats({
  total,
  withImages,
  inStockCount,
  lowStockCount,
  maxPrice,
  onlyWithImages,
  onToggleOnlyWithImages,
  stockFilter,
  onSetStockFilter,
}: CatalogueStatsProps) {
  const photoPercentage = total > 0 ? Math.round((withImages / total) * 100) : 0;
  const inStockPercentage = total > 0 ? Math.round((inStockCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 print:hidden">
      {/* 1. Total Products */}
      <button
        type="button"
        onClick={() => {
          onSetStockFilter("all");
          if (onlyWithImages) onToggleOnlyWithImages();
        }}
        className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
          stockFilter === "all" && !onlyWithImages
            ? "border-primary/50 bg-primary/5 shadow-xs ring-1 ring-primary/30"
            : "border-border/70 bg-card/80 hover:border-primary/30 hover:bg-card hover:shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Inventory
          </span>
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
            {total}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">items listed</span>
        </div>
      </button>

      {/* 2. In Stock */}
      <button
        type="button"
        onClick={() => onSetStockFilter(stockFilter === "in_stock" ? "all" : "in_stock")}
        className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
          stockFilter === "in_stock"
            ? "border-emerald-500/50 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-500/30"
            : "border-border/70 bg-card/80 hover:border-emerald-500/30 hover:bg-card hover:shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Available Stock
          </span>
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {inStockCount}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            ({inStockPercentage}% ready)
          </span>
        </div>
      </button>

      {/* 3. With Photos */}
      <button
        type="button"
        onClick={onToggleOnlyWithImages}
        className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
          onlyWithImages
            ? "border-primary/50 bg-primary/5 shadow-xs ring-1 ring-primary/30"
            : "border-border/70 bg-card/80 hover:border-primary/30 hover:bg-card hover:shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Photo Coverage
          </span>
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
            {withImages}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            ({photoPercentage}% illustrated)
          </span>
        </div>
      </button>

      {/* 4. Top Price or Low Stock */}
      <button
        type="button"
        onClick={() => onSetStockFilter(stockFilter === "low_stock" ? "all" : "low_stock")}
        className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
          stockFilter === "low_stock"
            ? "border-amber-500/50 bg-amber-500/5 shadow-xs ring-1 ring-amber-500/30"
            : "border-border/70 bg-card/80 hover:border-amber-500/30 hover:bg-card hover:shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {lowStockCount > 0 ? "Low Stock Alert" : "Top Value"}
          </span>
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              lowStockCount > 0
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            {lowStockCount > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {lowStockCount > 0 ? (
            <>
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
                {lowStockCount}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">needs restock</span>
            </>
          ) : (
            <>
              <span className="text-base sm:text-lg font-black font-mono tracking-tight text-foreground truncate">
                {formatCurrency(maxPrice)}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">peak</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
