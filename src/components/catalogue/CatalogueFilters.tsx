import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  Sparkles,
} from "lucide-react";
import { SortKey, ViewMode, StockFilter } from "./CatalogueTypes";

interface CatalogueFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  view: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  stockFilter: StockFilter;
  onStockFilterChange: (filter: StockFilter) => void;
  onlyWithImages: boolean;
  onOnlyWithImagesChange: (val: boolean) => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  filtersOpen: boolean;
  onToggleFiltersOpen: () => void;
  onClearFilters: () => void;
  totalFilteredCount: number;
  totalAllCount: number;
}

export function CatalogueFilters({
  search,
  onSearchChange,
  view,
  onViewChange,
  sort,
  onSortChange,
  stockFilter,
  onStockFilterChange,
  onlyWithImages,
  onOnlyWithImagesChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  filtersOpen,
  onToggleFiltersOpen,
  onClearFilters,
  totalFilteredCount,
  totalAllCount,
}: CatalogueFiltersProps) {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    onlyWithImages ||
    stockFilter !== "all" ||
    sort !== "name_asc";

  // Pre-configured price presets
  const applyPricePreset = (min: string, max: string) => {
    onMinPriceChange(min);
    onMaxPriceChange(max);
  };

  const isPresetActive = (min: string, max: string) =>
    minPrice === min && maxPrice === max;

  return (
    <div className="space-y-3 print:hidden">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Bar (No icon as specifically requested in guidelines/history) */}
        <div className="relative flex-1">
          <Input
            id="catalogue-search"
            placeholder="Search by product title or model..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-card/75 backdrop-blur-xs px-4 h-11 sm:h-10 border-border/70 focus-visible:ring-primary/20 rounded-xl text-sm transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Switcher & Filter Toggle */}
        <div className="flex gap-2 justify-end">
          {/* View toggle */}
          <div className="flex rounded-xl border border-border/70 bg-card/75 backdrop-blur-xs p-0.5 h-11 sm:h-10 items-center">
            <button
              id="view-grid-btn"
              type="button"
              title="Standard Grid"
              onClick={() => onViewChange("grid")}
              className={`h-9 px-2.5 rounded-lg flex items-center justify-center transition-all ${
                view === "grid"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              id="view-compact-btn"
              type="button"
              title="Compact Grid"
              onClick={() => onViewChange("compact")}
              className={`h-9 px-2.5 rounded-lg flex items-center justify-center transition-all ${
                view === "compact"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              id="view-list-btn"
              type="button"
              title="List View"
              onClick={() => onViewChange("list")}
              className={`h-9 px-2.5 rounded-lg flex items-center justify-center transition-all ${
                view === "list"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Advanced Filters Button */}
          <Button
            id="toggle-filters-btn"
            variant="outline"
            onClick={onToggleFiltersOpen}
            className={`h-11 sm:h-10 px-3.5 rounded-xl border-border/70 bg-card/75 backdrop-blur-xs transition-all flex items-center gap-2 ${
              filtersOpen || hasActiveFilters
                ? "border-primary text-primary bg-primary/5"
                : ""
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-semibold">Filters</span>
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Filter Chips (One-click presets) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => {
            onStockFilterChange("all");
            onOnlyWithImagesChange(false);
          }}
          className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
            stockFilter === "all" && !onlyWithImages
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          All Items
        </button>

        <button
          type="button"
          onClick={() =>
            onStockFilterChange(stockFilter === "in_stock" ? "all" : "in_stock")
          }
          className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            stockFilter === "in_stock"
              ? "bg-emerald-600 text-white shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          In Stock
        </button>

        <button
          type="button"
          onClick={() =>
            onStockFilterChange(stockFilter === "low_stock" ? "all" : "low_stock")
          }
          className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            stockFilter === "low_stock"
              ? "bg-amber-600 text-white shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Low Stock (≤10)
        </button>

        <button
          type="button"
          onClick={() => onOnlyWithImagesChange(!onlyWithImages)}
          className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            onlyWithImages
              ? "bg-blue-600 text-white shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          Photos Only
        </button>

        {/* Price Presets */}
        <button
          type="button"
          onClick={() =>
            isPresetActive("", "50000")
              ? applyPricePreset("", "")
              : applyPricePreset("", "50000")
          }
          className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
            isPresetActive("", "50000")
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          &lt; ₦50k
        </button>

        <button
          type="button"
          onClick={() =>
            isPresetActive("50000", "200000")
              ? applyPricePreset("", "")
              : applyPricePreset("50000", "200000")
          }
          className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
            isPresetActive("50000", "200000")
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          ₦50k – ₦200k
        </button>

        <button
          type="button"
          onClick={() =>
            isPresetActive("200000", "")
              ? applyPricePreset("", "")
              : applyPricePreset("200000", "")
          }
          className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap shrink-0 ${
            isPresetActive("200000", "")
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
          }`}
        >
          &gt; ₦200k
        </button>
      </div>

      {/* Expanded Filter Panel */}
      {filtersOpen && (
        <div className="rounded-2xl border border-border/70 bg-card/90 p-4 space-y-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Detailed Filter Parameters
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFiltersOpen}
              className="h-7 w-7 rounded-full hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Sort Order */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sort Order
              </label>
              <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
                <SelectTrigger className="min-h-[40px] text-sm rounded-xl bg-background/60 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_asc">Description: A → Z</SelectItem>
                  <SelectItem value="name_desc">Description: Z → A</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="qty_asc">Quantity: Low to High</SelectItem>
                  <SelectItem value="qty_desc">Quantity: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Price */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Minimum Price (₦)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                className="min-h-[40px] text-sm rounded-xl bg-background/60 border-border/60"
              />
            </div>

            {/* Max Price */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Maximum Price (₦)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="No limit"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="min-h-[40px] text-sm rounded-xl bg-background/60 border-border/60"
              />
            </div>

            {/* Stock Availability */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stock Status
              </label>
              <Select
                value={stockFilter}
                onValueChange={(v) => onStockFilterChange(v as StockFilter)}
              >
                <SelectTrigger className="min-h-[40px] text-sm rounded-xl bg-background/60 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Inventory</SelectItem>
                  <SelectItem value="in_stock">In Stock (&gt;0)</SelectItem>
                  <SelectItem value="low_stock">Low Stock (≤10)</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock (0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset All */}
          {hasActiveFilters && (
            <div className="flex justify-end pt-2 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs text-destructive hover:bg-destructive/10 font-semibold rounded-xl"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Result Count Status Line */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing{" "}
          <strong className="text-foreground font-semibold">
            {totalFilteredCount}
          </strong>{" "}
          of {totalAllCount} products
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-primary hover:underline font-medium text-xs"
          >
            Clear active filters
          </button>
        )}
      </div>
    </div>
  );
}
