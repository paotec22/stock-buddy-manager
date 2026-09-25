import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";
import {
  getInventoryImageUrls,
  getInventoryImageUrl,
  optimizeExistingInventoryImage,
} from "@/lib/inventoryImages";
import { CompanyLogo } from "@/components/CompanyLogo";
import {
  Printer,
  Sparkles,
  Loader2,
  Share2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { MobileFAB } from "@/components/MobileFAB";
import { Share2 as ShareIcon, Printer as PrintIcon, Sparkles as SparklesIcon } from "lucide-react";

// Modular catalogue components
import {
  SortKey,
  ViewMode,
  StockFilter,
} from "@/components/catalogue/CatalogueTypes";
import {
  CategoryId,
  getProductCategory,
  groupItemsByCategory,
  getCategoryCounts,
} from "@/utils/catalogueCategories";
import { CatalogueCategorySection } from "@/components/catalogue/CatalogueCategorySection";
import { CatalogueCategoryGrid } from "@/components/catalogue/CatalogueCategoryGrid";
import { CatalogueActiveCategoryBar } from "@/components/catalogue/CatalogueActiveCategoryBar";
import { CatalogueStats } from "@/components/catalogue/CatalogueStats";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  GridCard,
  CompactCard,
  ListRow,
  SkeletonCard,
} from "@/components/catalogue/CatalogueCard";
import { CatalogueFilters } from "@/components/catalogue/CatalogueFilters";
import { CatalogueQuickView } from "@/components/catalogue/CatalogueQuickView";
import { CatalogueShareDialog } from "@/components/catalogue/CatalogueShareDialog";
import { CataloguePrintView } from "@/components/catalogue/CataloguePrintView";

// ─── Constants ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 24;
const VIEW_KEY = "puido_catalogue_view_mode";
const GROUP_BY_CAT_KEY = "puido_catalogue_group_by_cat";

export default function Catalogue() {
  const location = "Ikeja";

  // Filter & sort state
  const [search, setSearch] = useState("");
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("all");

  // Mobile detection & category hub navigation state
  const isMobile = useIsMobile();
  const [showAllProductsFlat, setShowAllProductsFlat] = useState(false);

  // Group by category state (default true for relatable categorized browsing)
  const [groupByCategory, setGroupByCategory] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(GROUP_BY_CAT_KEY);
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  // Selected item for quick view modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Share link builder modal
  const [shareOpen, setShareOpen] = useState(false);

  // View mode
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(VIEW_KEY) as ViewMode) || "grid";
    } catch {
      return "grid";
    }
  });

  // Pagination
  const [page, setPage] = useState(1);

  // Incremental signed image cache
  const [signed, setSigned] = useState<Record<string, string>>({});
  const signingInProgressRef = useRef<Set<string>>(new Set());

  // Optimize state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState({ done: 0, total: 0 });

  // Print preparation state
  const [preparingPrint, setPreparingPrint] = useState(false);

  // Persist view mode
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {}
  }, [view]);

  // Persist groupByCategory mode
  useEffect(() => {
    try {
      localStorage.setItem(GROUP_BY_CAT_KEY, String(groupByCategory));
    } catch {}
  }, [groupByCategory]);

  // Reset pagination on filter, category, or search changes
  useEffect(() => {
    setPage(1);
  }, [search, onlyWithImages, stockFilter, sort, minPrice, maxPrice, selectedCategory, groupByCategory]);

  // ── Database Query (Targeted columns + cached) ──────────────────────────
  const { data: itemsData, isLoading, refetch } = useQuery({
    queryKey: ["catalogue", location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory list")
        .select('id, "Item Description", Price, Quantity, Total, location, image_url, features')
        .eq("location", "Ikeja")
        .order("Item Description", { ascending: true });
      if (error) throw error;
      return (data as InventoryItem[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => itemsData || [], [itemsData]);

  // ── Filter + Sort Logic ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let out = items.filter((it) => {
      // Category filter
      if (selectedCategory !== "all") {
        const cat = getProductCategory(it);
        if (cat.id !== selectedCategory) return false;
      }

      // Photo filter
      if (onlyWithImages && !it.image_url) return false;

      // Stock status filter
      const qty = it.Quantity ?? 0;
      if (stockFilter === "in_stock" && qty <= 0) return false;
      if (stockFilter === "low_stock" && (qty <= 0 || qty > 10)) return false;
      if (stockFilter === "out_of_stock" && qty > 0) return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const descMatch = it["Item Description"]?.toLowerCase().includes(q);
        const skuMatch = String(it.id).includes(q);
        if (!descMatch && !skuMatch) return false;
      }

      // Price filter
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && (it.Price || 0) < min) return false;
      if (!isNaN(max) && (it.Price || 0) > max) return false;

      return true;
    });

    // Sorting
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "name_asc":
          return (a["Item Description"] ?? "").localeCompare(b["Item Description"] ?? "");
        case "name_desc":
          return (b["Item Description"] ?? "").localeCompare(a["Item Description"] ?? "");
        case "price_asc":
          return (a.Price || 0) - (b.Price || 0);
        case "price_desc":
          return (b.Price || 0) - (a.Price || 0);
        case "qty_asc":
          return (a.Quantity || 0) - (b.Quantity || 0);
        case "qty_desc":
          return (b.Quantity || 0) - (a.Quantity || 0);
        default:
          return 0;
      }
    });

    return out;
  }, [items, search, onlyWithImages, stockFilter, sort, minPrice, maxPrice, selectedCategory]);

  // ── Category Counts & Grouped Sections ────────────────────────────────────
  const categoryCounts = useMemo(() => getCategoryCounts(items), [items]);
  const categoryGroups = useMemo(() => groupItemsByCategory(filtered), [filtered]);

  // Sample preview images by category for visual directory cards
  const previewImagesByCat = useMemo(() => {
    const map: Record<CategoryId, string[]> = {
      all: [],
      curtains_tracks: [],
      switches_panels: [],
      lighting_solar: [],
      security_access: [],
      hubs_power: [],
      hardware_accessories: [],
      general_products: [],
    };
    for (const item of items) {
      if (item.image_url && signed[item.image_url]) {
        const cat = getProductCategory(item);
        if (map[cat.id] && map[cat.id].length < 3) {
          map[cat.id].push(signed[item.image_url]);
        }
      }
    }
    return map;
  }, [items, signed]);

  // Show category directory initially on mobile or when browsing by category
  // If user has a search query or other filter, immediately show the matching products
  const showCategoryDirectory =
    selectedCategory === "all" &&
    !search.trim() &&
    !showAllProductsFlat &&
    stockFilter === "all" &&
    !onlyWithImages &&
    !minPrice &&
    !maxPrice &&
    (isMobile || groupByCategory);

  // ── Paginated Slice (Used in flat view mode) ───────────────────────────────
  const paginated = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const hasMore = page * PAGE_SIZE < filtered.length;

  // ── High-Performance Viewport Image Signing (Lazy on-demand) ──────────────
  // Sign images for visible items (both grouped and flat mode, plus category hub preview)
  useEffect(() => {
    const candidateItems =
      selectedCategory === "all" && !showAllProductsFlat
        ? items.slice(0, 30)
        : groupByCategory
        ? filtered.slice(0, 80)
        : filtered.slice(0, (page + 1) * PAGE_SIZE);

    if (candidateItems.length === 0) return;

    const neededPaths = candidateItems
      .map((it) => it.image_url)
      .filter((p): p is string => Boolean(p) && !signed[p] && !signingInProgressRef.current.has(p));

    if (neededPaths.length === 0) return;

    // Mark as in progress
    neededPaths.forEach((p) => signingInProgressRef.current.add(p));

    let active = true;
    getInventoryImageUrls(neededPaths).then((urlMap) => {
      if (!active) return;
      setSigned((prev) => ({ ...prev, ...urlMap }));
      neededPaths.forEach((p) => signingInProgressRef.current.delete(p));
    });

    return () => {
      active = false;
    };
  }, [groupByCategory, filtered, page, signed]);

  // Ensure selected item's image is loaded for quick view
  useEffect(() => {
    if (!selectedItem?.image_url) return;
    const path = selectedItem.image_url;
    if (signed[path]) return;

    getInventoryImageUrl(path).then((url) => {
      if (url) {
        setSigned((prev) => ({ ...prev, [path]: url }));
      }
    });
  }, [selectedItem, signed]);

  // ── Stats Summary Calculation ─────────────────────────────────────────────
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const prices = items.map((i) => i.Price || 0).filter((p) => p > 0);
    const inStock = items.filter((i) => (i.Quantity ?? 0) > 0).length;
    const lowStock = items.filter((i) => (i.Quantity ?? 0) > 0 && (i.Quantity ?? 0) <= 10).length;

    return {
      total: items.length,
      withImages: items.filter((i) => i.image_url).length,
      inStockCount: inStock,
      lowStockCount: lowStock,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  }, [items]);

  // ── Clear All Filters Handler ─────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyWithImages(false);
    setStockFilter("all");
    setSort("name_asc");
    setSelectedCategory("all");
    setShowAllProductsFlat(false);
  }, []);

  // ── Print Catalogue with On-Demand Image Fetch ────────────────────────────
  const handlePrint = useCallback(async () => {
    const missingPaths = filtered
      .map((it) => it.image_url)
      .filter((p): p is string => Boolean(p) && !signed[p]);

    if (missingPaths.length > 0) {
      setPreparingPrint(true);
      const toastId = toast.loading(`Preparing ${missingPaths.length} photos for print...`);
      try {
        const newMap = await getInventoryImageUrls(missingPaths);
        setSigned((prev) => ({ ...prev, ...newMap }));
        toast.dismiss(toastId);
      } catch (e) {
        console.warn("Error signing print images:", e);
        toast.dismiss(toastId);
      } finally {
        setPreparingPrint(false);
      }
    }

    const originalTitle = document.title;
    try {
      document.title = `Puido_Catalogue_${location}_${new Date().toISOString().slice(0, 10)}`;
    } catch {}
    window.print();
    setTimeout(() => {
      try {
        document.title = originalTitle;
      } catch {}
    }, 1000);
  }, [filtered, signed, location]);

  // ── Batch Image Optimizer ─────────────────────────────────────────────────
  const handleOptimizeImages = useCallback(async () => {
    const targets = items.filter((i) => i.image_url) as (InventoryItem & {
      image_url: string;
    })[];
    if (targets.length === 0) {
      toast.info("No images to optimize");
      return;
    }
    if (
      !window.confirm(
        `Optimize ${targets.length} existing image(s) to modern WebP format? This improves catalogue speed.`
      )
    ) {
      return;
    }

    setOptimizing(true);
    setOptimizeProgress({ done: 0, total: targets.length });
    let saved = 0;
    let optimized = 0;

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      try {
        const result = await optimizeExistingInventoryImage(item.image_url, item.id);
        if (result) {
          const { error } = await supabase
            .from("inventory list")
            .update({ image_url: result.newPath } as never)
            .eq("id", item.id)
            .eq("location", item.location);
          if (!error) {
            optimized++;
            saved += result.oldSize - result.newSize;
          }
        }
      } catch (e) {
        console.error("Optimize failed for item", item.id, e);
      }
      setOptimizeProgress({ done: i + 1, total: targets.length });
    }

    setOptimizing(false);
    const kb = Math.round(saved / 1024);
    toast.success(`Optimized ${optimized} image(s). Saved ~${kb} KB.`);
    refetch();
  }, [items, refetch]);

  return (
    <div className="space-y-5 fade-in pb-12 print:space-y-0 print:pb-0 catalogue-bg -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-24 px-4 md:px-8 lg:px-16 xl:px-24 pt-4 md:pt-6">
      {/* ── PRINT-ONLY VIEW ──────────────────────────────────────────────── */}
      <CataloguePrintView
        items={filtered}
        signedUrls={signed}
        location={location}
      />

      {/* ── EXECUTIVE SCREEN HEADER ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 sm:p-7 shadow-xs backdrop-blur-md print:hidden flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 p-2">
            <CompanyLogo alt="Puido Smart Solutions" className="h-9 w-auto object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Product Catalogue
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {location} Showroom
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Browse inventory, create sales quotes, or export print-ready PDF catalogues.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 relative z-10 w-full md:flex md:w-auto md:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimizeImages}
            disabled={optimizing}
            title="Optimize image sizes for faster browsing"
            className="h-11 sm:h-10 rounded-xl hover:bg-primary/5 hover:text-primary border-border/70 font-semibold transition-all px-2.5 sm:px-3 text-xs flex items-center justify-center active:scale-[0.98]"
          >
            {optimizing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary mr-1 sm:mr-1.5 shrink-0" />
                <span className="text-primary text-[11px] sm:text-xs truncate">
                  {optimizeProgress.done}/{optimizeProgress.total}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-primary mr-1 sm:mr-1.5 shrink-0" />
                <span className="truncate">Optimize</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            title="Share interactive catalogue link with clients"
            className="h-11 sm:h-10 rounded-xl hover:bg-primary/5 hover:text-primary border-border/70 font-semibold transition-all px-2.5 sm:px-3.5 text-xs flex items-center justify-center active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4 text-primary mr-1 sm:mr-1.5 shrink-0" />
            <span className="truncate"><span className="hidden xs:inline">Share </span>Link</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            disabled={preparingPrint}
            title="Print or export to PDF"
            className="h-11 sm:h-10 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all px-2.5 sm:px-4 text-xs flex items-center justify-center active:scale-[0.98]"
          >
            {preparingPrint ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1 sm:mr-1.5 shrink-0" />
                <span className="text-[11px] sm:text-xs truncate">Preparing...</span>
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-1 sm:mr-1.5 shrink-0" />
                <span className="truncate"><span className="hidden xs:inline">Print </span>Catalogue</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── INTERACTIVE STATS BAR ────────────────────────────────────────── */}
      {stats && !isLoading && (
        <CatalogueStats
          total={stats.total}
          withImages={stats.withImages}
          inStockCount={stats.inStockCount}
          lowStockCount={stats.lowStockCount}
          maxPrice={stats.maxPrice}
          onlyWithImages={onlyWithImages}
          onToggleOnlyWithImages={() => setOnlyWithImages((v) => !v)}
          stockFilter={stockFilter}
          onSetStockFilter={setStockFilter}
        />
      )}

      {/* ── SEARCH & FILTER BAR ──────────────────────────────────────────── */}
      <CatalogueFilters
        search={search}
        onSearchChange={setSearch}
        view={view}
        onViewChange={setView}
        sort={sort}
        onSortChange={setSort}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        onlyWithImages={onlyWithImages}
        onOnlyWithImagesChange={setOnlyWithImages}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        filtersOpen={filtersOpen}
        onToggleFiltersOpen={() => setFiltersOpen((v) => !v)}
        onClearFilters={clearFilters}
        totalFilteredCount={filtered.length}
        totalAllCount={items.length}
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => {
          setSelectedCategory(cat);
          setShowAllProductsFlat(false);
        }}
        categoryCounts={categoryCounts}
        groupByCategory={groupByCategory}
        onToggleGroupByCategory={() => setGroupByCategory((v) => !v)}
      />

      {/* ── ACTIVE CATEGORY BAR (When user clicks into an intended category) ── */}
      {selectedCategory !== "all" && !isLoading && (
        <CatalogueActiveCategoryBar
          selectedCategory={selectedCategory}
          onBackToCategories={() => {
            setSelectedCategory("all");
            setShowAllProductsFlat(false);
          }}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            setShowAllProductsFlat(false);
          }}
          categoryCounts={categoryCounts}
          totalCategoryItems={filtered.length}
        />
      )}

      {/* ── MAIN PRODUCT GRID / LIST / CATEGORY HUB / SKELETON ─────────── */}
      {isLoading ? (
        view === "grid" ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 print:hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} view="grid" />
            ))}
          </div>
        ) : view === "compact" ? (
          <div className="grid gap-2 sm:gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 print:hidden">
            {Array.from({ length: 16 }).map((_, i) => (
              <SkeletonCard key={i} view="compact" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 print:hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} view="list" />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-card rounded-3xl border border-dashed border-border/80 p-8 print:hidden">
          <div className="h-16 w-16 rounded-2xl bg-muted/70 flex items-center justify-center text-muted-foreground">
            <Package className="h-8 w-8 opacity-40" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">No matching products found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              We couldn&apos;t find any inventory matching your current search and filter settings.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="rounded-xl px-4 mt-2 font-medium"
          >
            Reset all filters
          </Button>
        </div>
      ) : showCategoryDirectory ? (
        /* ── Initial Category Hub: Shows categories first for intuitive mobile browsing ── */
        <div className="print:hidden">
          <CatalogueCategoryGrid
            categoryCounts={categoryCounts}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              setShowAllProductsFlat(false);
            }}
            onViewAllProducts={() => setShowAllProductsFlat(true)}
            totalProducts={items.length}
            locationName={location}
            previewImagesByCat={previewImagesByCat}
          />
        </div>
      ) : groupByCategory && selectedCategory === "all" ? (
        /* Grouped by Relatable Categories */
        <div className="space-y-7 sm:space-y-8 print:hidden">
          {categoryGroups.map((group) => (
            <CatalogueCategorySection
              key={group.category.id}
              category={group.category}
              items={group.items}
              view={view}
              signedUrls={signed}
              onSelectItem={setSelectedItem}
              onSelectCategoryFilter={(catId) => {
                setSelectedCategory(catId as CategoryId);
                setShowAllProductsFlat(false);
              }}
            />
          ))}
        </div>
      ) : (
        /* Standard Flat Products View (or single category products view) */
        <div>
          {view === "grid" && (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 print:hidden">
              {paginated.map((item) => (
                <GridCard
                  key={`${item.location}-${item.id}`}
                  item={item}
                  url={item.image_url ? signed[item.image_url] ?? null : null}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}

          {view === "compact" && (
            <div className="grid gap-2.5 sm:gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 print:hidden">
              {paginated.map((item) => (
                <CompactCard
                  key={`${item.location}-${item.id}`}
                  item={item}
                  url={item.image_url ? signed[item.image_url] ?? null : null}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}

          {view === "list" && (
            <div className="space-y-2.5 print:hidden">
              {paginated.map((item) => (
                <ListRow
                  key={`${item.location}-${item.id}`}
                  item={item}
                  url={item.image_url ? signed[item.image_url] ?? null : null}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SHOW MORE PAGINATION BUTTON (Only in products view when more exist) ── */}
      {!isLoading && !showCategoryDirectory && (!groupByCategory || selectedCategory !== "all") && hasMore && (
        <div className="flex flex-col items-center justify-center pt-4 print:hidden gap-2">
          <Button
            id="show-more-btn"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            className="w-full sm:w-auto min-h-[44px] px-8 font-semibold text-xs sm:text-sm rounded-2xl border-border/80 hover:bg-primary/5 hover:text-primary transition-all active:scale-[0.99]"
          >
            Load more products ({filtered.length - paginated.length} remaining)
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Viewing {paginated.length} of {filtered.length} products
          </span>
        </div>
      )}

      {/* ── QUICK VIEW DIALOG ────────────────────────────────────────────── */}
      <CatalogueQuickView
        item={selectedItem}
        imageUrl={selectedItem?.image_url ? signed[selectedItem.image_url] ?? null : null}
        onClose={() => setSelectedItem(null)}
      />

      {/* ── SHARE CATALOGUE DIALOG ───────────────────────────────────────── */}
      <CatalogueShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        items={items}
      />

      {/* ── MOBILE QUICK ACTION FAB ──────────────────────────────────────── */}
      <MobileFAB
        primaryAction={{
          label: "Share",
          icon: ShareIcon,
          onClick: () => setShareOpen(true),
          shortcut: "⌘S",
        }}
        secondaryActions={[
          { label: "Print", icon: PrintIcon, onClick: handlePrint },
          { label: "Optimize", icon: SparklesIcon, onClick: handleOptimizeImages },
        ]}
        tourId="fab"
      />
    </div>
  );
}
