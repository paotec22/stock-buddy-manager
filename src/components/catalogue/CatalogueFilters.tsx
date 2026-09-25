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
  Search,
  X,
  Sparkles,
  FolderTree,
  Layers,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { SortKey, ViewMode, StockFilter } from "./CatalogueTypes";
import {
  CategoryId,
  PRODUCT_CATEGORIES,
} from "@/utils/catalogueCategories";

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
  // Category grouping and selection props
  selectedCategory: CategoryId;
  onCategoryChange: (cat: CategoryId) => void;
  categoryCounts: Record<CategoryId | "all", number>;
  groupByCategory: boolean;
  onToggleGroupByCategory: () => void;
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
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  groupByCategory,
  onToggleGroupByCategory,
}: CatalogueFiltersProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState<boolean>(Boolean(search));
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Sync mobile search open state if external search changes
  React.useEffect(() => {
    if (search && !mobileSearchOpen) {
      setMobileSearchOpen(true);
    }
  }, [search, mobileSearchOpen]);

  // Focus input when mobile search is opened
  React.useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [mobileSearchOpen]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (onlyWithImages) count++;
    if (stockFilter !== "all") count++;
    if (sort !== "name_asc") count++;
    return count;
  }, [minPrice, maxPrice, onlyWithImages, stockFilter, sort]);

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    onlyWithImages ||
    stockFilter !== "all" ||
    sort !== "name_asc" ||
    selectedCategory !== "all";

  // Pre-configured price presets
  const applyPricePreset = (min: string, max: string) => {
    onMinPriceChange(min);
    onMaxPriceChange(max);
  };

  const isPresetActive = (min: string, max: string) =>
    minPrice === min && maxPrice === max;

  const handleCloseMobileSearch = () => {
    if (search) {
      onSearchChange("");
    }
    setMobileSearchOpen(false);
  };

  return (
    <div className="space-y-3 print:hidden">
      {/* ── MOBILE VIEW: COLLAPSIBLE SEARCH & COMPACT BUTTON BAR (< sm) ── */}
      <div className="sm:hidden space-y-2">
        {mobileSearchOpen ? (
          /* Mobile Open Search Bar */
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                id="catalogue-search-mobile"
                placeholder="Search products, model, SKU..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-card/90 backdrop-blur-xs pl-9 pr-9 h-11 border-primary/40 focus-visible:ring-primary/30 rounded-xl text-sm transition-all shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Clear search text"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseMobileSearch}
              className="h-11 px-3.5 rounded-xl border-border/80 bg-card font-semibold text-xs shrink-0 active:scale-[0.98]"
            >
              Done
            </Button>
          </div>
        ) : (
          /* Mobile Button Toolbar when Search is not open */
          <div className="grid grid-cols-4 gap-1.5 items-center">
            {/* Search Trigger Button */}
            <Button
              id="mobile-search-toggle-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileSearchOpen(true)}
              className="h-11 px-2 rounded-xl border-border/70 bg-card/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary transition-all active:scale-[0.98]"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">Search</span>
            </Button>

            {/* Filter Trigger Button */}
            <Button
              id="mobile-filter-toggle-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleFiltersOpen}
              className={`h-11 px-2 rounded-xl border-border/70 backdrop-blur-xs flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-[0.98] ${
                filtersOpen || activeFilterCount > 0
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                  : "bg-card/80 text-foreground hover:border-primary/40"
              }`}
            >
              <SlidersHorizontal className={`h-4 w-4 shrink-0 ${filtersOpen || activeFilterCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
              <span className="truncate">Filter</span>
              {activeFilterCount > 0 && (
                <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Group by Category Toggle */}
            <Button
              id="mobile-group-toggle-btn"
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleGroupByCategory}
              className={`h-11 px-2 rounded-xl border-border/70 backdrop-blur-xs flex items-center justify-center gap-1 text-xs font-semibold transition-all active:scale-[0.98] ${
                groupByCategory
                  ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-xs"
                  : "bg-card/80 text-muted-foreground hover:text-foreground"
              }`}
              title={groupByCategory ? "Category grouping enabled" : "Enable category grouping"}
            >
              <FolderTree className={`h-4 w-4 shrink-0 ${groupByCategory ? "text-primary" : "text-muted-foreground"}`} />
              <span className="truncate">Group</span>
              {groupByCategory && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              )}
            </Button>

            {/* Compact View Switcher */}
            <div className="flex rounded-xl border border-border/70 bg-card/80 backdrop-blur-xs p-0.5 h-11 items-center justify-between">
              <button
                type="button"
                title="Grid view"
                onClick={() => onViewChange("grid")}
                className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-all ${
                  view === "grid"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Compact grid"
                onClick={() => onViewChange("compact")}
                className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-all ${
                  view === "compact"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="List view"
                onClick={() => onViewChange("list")}
                className={`flex-1 h-9 rounded-lg flex items-center justify-center transition-all ${
                  view === "list"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP VIEW: STANDARD TOP SEARCH & ACTIONS ROW (>= sm) ── */}
      <div className="hidden sm:flex flex-row gap-2.5">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="catalogue-search"
            placeholder="Search products by title, model, or SKU..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-card/75 backdrop-blur-xs pl-9 pr-8 h-10 border-border/70 focus-visible:ring-primary/20 rounded-xl text-sm transition-all"
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

        {/* View Switcher, Grouping Toggle & Filter Toggle */}
        <div className="flex gap-2 justify-end items-center flex-nowrap">
          {/* Group by Category Toggle */}
          <Button
            id="toggle-group-by-category-btn"
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleGroupByCategory}
            title={
              groupByCategory
                ? "Category section grouping enabled"
                : "Enable category section grouping"
            }
            className={`h-10 px-3 rounded-xl border-border/70 transition-all flex items-center gap-1.5 shrink-0 ${
              groupByCategory
                ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-xs hover:bg-primary/15"
                : "bg-card/75 text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderTree className={`h-4 w-4 ${groupByCategory ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-xs font-semibold">Group by Category</span>
            {groupByCategory && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Button>

          {/* View toggle (Grid / Compact / List) */}
          <div className="flex rounded-xl border border-border/70 bg-card/75 backdrop-blur-xs p-0.5 h-10 items-center shrink-0">
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
            className={`h-10 px-3.5 rounded-xl border-border/70 bg-card/75 backdrop-blur-xs transition-all flex items-center gap-2 shrink-0 ${
              filtersOpen || activeFilterCount > 0
                ? "border-primary text-primary bg-primary/5"
                : ""
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-semibold">Filters</span>
            {activeFilterCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── Category Navigation Pills (Horizontally Scrollable) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
        {/* All Categories Pill / Back to All */}
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
          }`}
          title={selectedCategory !== "all" ? "Return to all categories directory" : "Browse all categories"}
        >
          {selectedCategory !== "all" ? (
            <ArrowLeft className="h-3.5 w-3.5" />
          ) : (
            <Layers className="h-3.5 w-3.5" />
          )}
          <span>All Categories</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
              selectedCategory === "all"
                ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                : "bg-primary/20 text-primary font-bold"
            }`}
          >
            {categoryCounts.all || totalAllCount}
          </span>
        </button>

        {/* Individual Category Pills */}
        {PRODUCT_CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          if (count === 0 && selectedCategory !== cat.id) return null; // Only show categories with inventory unless selected
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(isSelected ? "all" : cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-2 border ${
                isSelected
                  ? cat.pillActiveClass
                  : "bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{cat.shortName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isSelected
                    ? "bg-white/20 text-white font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Collapsible Detailed Filter Panel (Hidden when not in use) ── */}
      {filtersOpen && (
        <div className="rounded-2xl border border-border/70 bg-card/95 p-4 space-y-4 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Filter &amp; Refine Products
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFiltersOpen}
              className="h-8 w-8 rounded-full hover:bg-muted"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Filter Chips inside Filters Panel */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Quick Stock &amp; Photo Filters
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => {
                  onStockFilterChange("all");
                  onOnlyWithImagesChange(false);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 ${
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
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 ${
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
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 ${
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
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap shrink-0 ${
                  isPresetActive("200000", "")
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                }`}
              >
                &gt; ₦200k
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={(v) => onCategoryChange(v as CategoryId)}
              >
                <SelectTrigger className="min-h-[42px] text-sm rounded-xl bg-background/60 border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Categories ({categoryCounts.all || totalAllCount})
                  </SelectItem>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({categoryCounts[c.id] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sort Order
              </label>
              <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
                <SelectTrigger className="min-h-[42px] text-sm rounded-xl bg-background/60 border-border/60">
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
                className="min-h-[42px] text-sm rounded-xl bg-background/60 border-border/60"
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
                className="min-h-[42px] text-sm rounded-xl bg-background/60 border-border/60"
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
                <SelectTrigger className="min-h-[42px] text-sm rounded-xl bg-background/60 border-border/60">
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
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <span className="text-xs text-muted-foreground">
              {activeFilterCount > 0 ? `${activeFilterCount} filter(s) currently active` : "No active filters"}
            </span>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-xs text-destructive hover:bg-destructive/10 font-semibold rounded-xl h-9 px-3"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset all filters
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={onToggleFiltersOpen}
                className="text-xs font-semibold rounded-xl h-9 px-4"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Filters Summary Tags (Shown when filters are active & panel is closed) ── */}
      {!filtersOpen && activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
          <span className="text-muted-foreground text-[11px] font-medium">Active filters:</span>
          {stockFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
              Stock: {stockFilter === "in_stock" ? "In Stock" : stockFilter === "low_stock" ? "Low Stock" : "Out of Stock"}
              <button
                type="button"
                onClick={() => onStockFilterChange("all")}
                className="hover:text-primary-foreground hover:bg-primary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {onlyWithImages && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[11px] font-semibold">
              With Photos Only
              <button
                type="button"
                onClick={() => onOnlyWithImagesChange(false)}
                className="hover:text-white hover:bg-blue-600 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {(minPrice || maxPrice) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold">
              Price: {minPrice ? `₦${Number(minPrice).toLocaleString()}` : "₦0"} – {maxPrice ? `₦${Number(maxPrice).toLocaleString()}` : "∞"}
              <button
                type="button"
                onClick={() => {
                  onMinPriceChange("");
                  onMaxPriceChange("");
                }}
                className="hover:text-primary-foreground hover:bg-primary rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {sort !== "name_asc" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[11px] font-semibold">
              Sorted
              <button
                type="button"
                onClick={() => onSortChange("name_asc")}
                className="hover:text-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-primary hover:underline font-semibold ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Result Count Status Line ── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing{" "}
            <strong className="text-foreground font-semibold">
              {totalFilteredCount}
            </strong>{" "}
            of {totalAllCount} products
          </span>
          {groupByCategory && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
              Grouped
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-primary hover:underline font-medium text-xs flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

