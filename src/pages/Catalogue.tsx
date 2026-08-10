import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";
import {
  getInventoryImageUrls,
  optimizeExistingInventoryImage,
} from "@/lib/inventoryImages";
import { formatCurrency } from "@/utils/formatters";
import {
  ImageOff,
  Printer,
  Search,
  Sparkles,
  Loader2,
  Share2,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Package,
  TrendingUp,
  Camera,
  X,
  Eye,
  Copy,
  Check,
  Building2,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const VIEW_KEY = "catalogue_view_mode";

type SortKey =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "qty_asc";

type ViewMode = "grid" | "list";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStockStatus(qty: number) {
  if (qty <= 0)
    return {
      label: "Out of Stock",
      badgeColor: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50",
      dotColor: "bg-red-500",
    };
  if (qty <= 10)
    return {
      label: "Low Stock",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50",
      dotColor: "bg-amber-500",
    };
  return {
    label: "In Stock",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50",
    dotColor: "bg-emerald-500",
  };
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card animate-pulse">
        <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-6 bg-muted rounded w-20" />
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-5 bg-muted rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

// ─── On-Screen Grid Card ──────────────────────────────────────────────────────
function GridCard({
  item,
  url,
  onClick,
}: {
  item: InventoryItem;
  url: string | null;
  onClick: () => void;
}) {
  const stock = getStockStatus(item.Quantity ?? 0);
  return (
    <Card
      onClick={onClick}
      className="overflow-hidden group cursor-pointer border border-border/60 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-card"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {url ? (
          <>
            <img
              src={url}
              alt={item["Item Description"]}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
              width={400}
              height={400}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 text-slate-900 shadow-md backdrop-blur-sm">
                <Eye className="h-3.5 w-3.5" /> Quick View
              </span>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2 bg-gradient-to-br from-muted to-muted/50">
            <ImageOff className="h-9 w-9 opacity-30" />
            <span className="text-xs text-muted-foreground/60">No image available</span>
          </div>
        )}

        {/* Stock status pill */}
        <div
          className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-sm backdrop-blur-md ${stock.badgeColor}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${stock.dotColor}`} />
          {stock.label}
        </div>
      </div>

      <CardContent className="p-3.5 space-y-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.4rem] group-hover:text-primary transition-colors">
          {item["Item Description"]}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded">
            SKU #{item.id}
          </span>
          <span>
            Qty: <strong className="text-foreground font-semibold">{item.Quantity ?? 0}</strong>
          </span>
        </div>
        <div className="pt-1 flex items-center justify-between">
          <span className="text-base font-bold text-primary tracking-tight">
            {formatCurrency(item.Price || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── On-Screen List Row ───────────────────────────────────────────────────────
function ListRow({
  item,
  url,
  onClick,
}: {
  item: InventoryItem;
  url: string | null;
  onClick: () => void;
}) {
  const stock = getStockStatus(item.Quantity ?? 0);
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3.5 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-all cursor-pointer group hover:border-primary/30"
    >
      <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
        {url ? (
          <img
            src={url}
            alt={item["Item Description"]}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={64}
            height={64}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-5 w-5 opacity-30" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {item["Item Description"]}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="text-muted-foreground font-mono">SKU #{item.id}</span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stock.badgeColor}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${stock.dotColor}`} />
            {stock.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
        <span className="font-bold text-base text-primary">
          {formatCurrency(item.Price || 0)}
        </span>
        <span className="text-xs text-muted-foreground">
          Qty: <strong className="text-foreground">{item.Quantity ?? 0}</strong>
        </span>
      </div>
    </div>
  );
}

// ─── Print-Only Card Component (Clean, High-End Print Layout) ───────────────
function PrintCard({
  item,
  url,
}: {
  item: InventoryItem;
  url: string | null;
}) {
  return (
    <div className="print-card-item rounded-lg border border-slate-300 bg-white overflow-hidden p-0 flex flex-col justify-between text-slate-900 shadow-none">
      <div>
        {/* Aspect square image */}
        <div className="aspect-square bg-slate-100 relative overflow-hidden border-b border-slate-200 flex items-center justify-center">
          {url ? (
            <img
              src={url}
              alt={item["Item Description"]}
              className="h-full w-full object-cover"
              decoding="sync"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              <ImageOff className="h-8 w-8" />
              <span className="text-[10px]">No image</span>
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="p-3 space-y-1.5">
          <h4 className="font-bold text-xs leading-snug line-clamp-2 text-slate-900">
            {item["Item Description"]}
          </h4>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>SKU: #{item.id}</span>
            <span>Qty: {item.Quantity ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Price Footer */}
      <div className="px-3 pb-3 pt-1 border-t border-slate-100 flex items-center justify-between mt-auto">
        <span className="text-[10px] uppercase font-bold text-slate-400">Price</span>
        <span className="text-sm font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {formatCurrency(item.Price || 0)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Catalogue() {
  const location = "Ikeja";

  // Filter & sort state
  const [search, setSearch] = useState("");
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Selected item for preview modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // View & pagination state
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(VIEW_KEY) as ViewMode) || "grid";
    } catch {
      return "grid";
    }
  });
  const [page, setPage] = useState(1);

  // Image state
  const [signed, setSigned] = useState<Record<string, string>>({});

  // Optimize state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState({
    done: 0,
    total: 0,
  });

  // Persist view mode
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {}
    setPage(1);
  }, [view]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, onlyWithImages, sort, minPrice, maxPrice]);

  // ── Data Query ──────────────────────────────────────────────────────────────
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalogue", location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory list")
        .select("*")
        .eq("location", "Ikeja")
        .order("Item Description", { ascending: true });
      if (error) throw error;
      return (data as InventoryItem[]) || [];
    },
  });

  useEffect(() => {
    const paths = items.map((i) => i.image_url).filter(Boolean) as string[];
    if (paths.length === 0) {
      setSigned({});
      return;
    }
    getInventoryImageUrls(paths).then(setSigned);
  }, [items]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const prices = items.map((i) => i.Price || 0).filter((p) => p > 0);
    const totalInventoryValue = items.reduce(
      (sum, item) => sum + (item.Price || 0) * (item.Quantity || 0),
      0
    );
    return {
      total: items.length,
      withImages: items.filter((i) => i.image_url).length,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      totalValue: totalInventoryValue,
    };
  }, [items]);

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let out = items.filter((it) => {
      if (onlyWithImages && !it.image_url) return false;
      if (
        search.trim() &&
        !it["Item Description"]?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && (it.Price || 0) < min) return false;
      if (!isNaN(max) && (it.Price || 0) > max) return false;
      return true;
    });

    out = [...out].sort((a, b) => {
      switch (sort) {
        case "name_asc":
          return (a["Item Description"] ?? "").localeCompare(
            b["Item Description"] ?? ""
          );
        case "name_desc":
          return (b["Item Description"] ?? "").localeCompare(
            a["Item Description"] ?? ""
          );
        case "price_asc":
          return (a.Price || 0) - (b.Price || 0);
        case "price_desc":
          return (b.Price || 0) - (a.Price || 0);
        case "qty_asc":
          return (a.Quantity || 0) - (b.Quantity || 0);
        default:
          return 0;
      }
    });

    return out;
  }, [items, search, onlyWithImages, sort, minPrice, maxPrice]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  // ── Optimize Images Handler ─────────────────────────────────────────────────
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
        `Optimize ${targets.length} existing image(s)? This may take a minute.`
      )
    )
      return;

    setOptimizing(true);
    setOptimizeProgress({ done: 0, total: targets.length });
    let saved = 0;
    let optimized = 0;
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      try {
        const result = await optimizeExistingInventoryImage(
          item.image_url,
          item.id
        );
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
        console.error("optimize failed for", item.id, e);
      }
      setOptimizeProgress({ done: i + 1, total: targets.length });
    }
    setOptimizing(false);
    const kb = Math.round(saved / 1024);
    toast.success(`Optimized ${optimized} image(s). Saved ~${kb} KB.`);
    const paths = items.map((i) => i.image_url).filter(Boolean) as string[];
    setSigned(await getInventoryImageUrls(paths));
  }, [items]);

  const handleShare = useCallback(async () => {
    const link = `${window.location.origin}/share/catalogue`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Product Catalogue", url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Share link copied to clipboard");
      }
    } catch {
      await navigator.clipboard.writeText(link);
      toast.success("Share link copied to clipboard");
    }
  }, []);

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setOnlyWithImages(false);
    setSort("name_asc");
  };

  const hasActiveFilters =
    search || minPrice || maxPrice || onlyWithImages || sort !== "name_asc";

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 fade-in pb-10 print:space-y-0 print:pb-0">

      {/* ── PRINT-ONLY STUNNING CATALOGUE HEADER ──────────────────────────── */}
      <div className="hidden print:block print:mb-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <img
              src="/Puido_Smart_Solutions.svg"
              alt="Puido Smart Solutions"
              className="h-14 w-auto object-contain"
            />
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                PRODUCT CATALOGUE
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded">
              {location.toUpperCase()} BRANCH
            </span>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Date: {currentDateFormatted}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 rounded mt-2 border border-slate-200">
          <span>Total Products: <strong>{filtered.length}</strong></span>
          <span>Currency: <strong>NGN (₦)</strong></span>
          <span>Official Stock Catalogue</span>
        </div>
      </div>

      {/* ── SCREEN HEADER (Hidden when printing) ─────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <img
            src="/Puido_Smart_Solutions.svg"
            alt="Puido Smart Solutions"
            className="h-12 md:h-14 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Product Catalogue
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Browse inventory — {location} Branch
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimizeImages}
            disabled={optimizing}
            className="flex-1 sm:flex-none"
          >
            {optimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="truncate">
                  {optimizeProgress.done}/{optimizeProgress.total}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5 text-amber-500" />
                Optimize Images
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-1 sm:flex-none"
          >
            <Share2 className="h-4 w-4 mr-1.5 text-primary" />
            Share
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none font-semibold shadow-sm"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Catalogue
          </Button>
        </div>
      </div>

      {/* ── SCREEN STATS BAR (Hidden when printing) ──────────────────────── */}
      {stats && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3 print:hidden">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none font-medium">Total Products</p>
              <p className="text-base font-bold mt-1 truncate">{stats.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none font-medium">With Photos</p>
              <p className="text-base font-bold mt-1 truncate">{stats.withImages}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs">
            <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none font-medium">Highest Price</p>
              <p className="text-sm font-bold mt-1 truncate">
                {formatCurrency(stats.maxPrice)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-xs">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Boxes className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none font-medium">Total Stock Value</p>
              <p className="text-sm font-bold mt-1 truncate text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS (Hidden when printing) ───────────────── */}
      <div className="space-y-2.5 print:hidden">
        <div className="flex gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="catalogue-search"
              placeholder="Search by product title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9.5 bg-card"
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-border bg-card overflow-hidden">
            <button
              id="view-grid-btn"
              title="Grid view"
              onClick={() => setView("grid")}
              className={`px-3 py-2 transition-colors ${
                view === "grid"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              id="view-list-btn"
              title="List view"
              onClick={() => setView("list")}
              className={`px-3 py-2 transition-colors ${
                view === "list"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Filter button */}
          <Button
            id="toggle-filters-btn"
            variant="outline"
            size="icon"
            onClick={() => setFiltersOpen((v) => !v)}
            className="relative flex-shrink-0 bg-card"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Collapsible Filter Panel */}
        {filtersOpen && (
          <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Sort */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Sort Order
                </label>
                <Select
                  value={sort}
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  <SelectTrigger id="sort-select" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Name: A → Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z → A</SelectItem>
                    <SelectItem value="price_asc">
                      Price: Low → High
                    </SelectItem>
                    <SelectItem value="price_desc">
                      Price: High → Low
                    </SelectItem>
                    <SelectItem value="qty_asc">Qty: Low → High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min price */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Min Price (₦)
                </label>
                <Input
                  id="min-price-input"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Max price */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Max Price (₦)
                </label>
                <Input
                  id="max-price-input"
                  type="number"
                  min={0}
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Images only toggle */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Photo Status
                </label>
                <Button
                  id="images-only-btn"
                  variant={onlyWithImages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOnlyWithImages((v) => !v)}
                  className="w-full h-9 text-sm justify-start"
                >
                  {onlyWithImages ? "Showing photos only" : "All items (with or without photos)"}
                </Button>
              </div>
            </div>

            {/* Clear button */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-1">
                <Button
                  id="clear-filters-btn"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground h-7"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Counter */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground px-0.5">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {Math.min(paginated.length, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            products
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-2 text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Reset filters
              </button>
            )}
          </p>
        )}
      </div>

      {/* ── ON-SCREEN CONTENT AREA ────────────────────────────────────────── */}
      {isLoading ? (
        view === "grid" ? (
          <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} view="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 print:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} view="list" />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-card rounded-2xl border border-dashed p-6 print:hidden">
          <div className="h-16 w-16 rounded-2xl bg-muted/80 flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">No products found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {hasActiveFilters
                ? "Try clearing search keywords or price boundaries."
                : "Add images to inventory items to populate your visual catalogue."}
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* On-screen Paginated Grid/List (Hidden when printing) */}
          {view === "grid" ? (
            <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children print:hidden">
              {paginated.map((item) => {
                const url = item.image_url ? signed[item.image_url] : null;
                return (
                  <GridCard
                    key={`${item.location}-${item.id}`}
                    item={item}
                    url={url}
                    onClick={() => setSelectedItem(item)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 print:hidden">
              {paginated.map((item) => {
                const url = item.image_url ? signed[item.image_url] : null;
                return (
                  <ListRow
                    key={`${item.location}-${item.id}`}
                    item={item}
                    url={url}
                    onClick={() => setSelectedItem(item)}
                  />
                );
              })}
            </div>
          )}

          {/* ── PRINT-ONLY CATALOGUE GRID (Renders all filtered items cleanly) ── */}
          <div className="hidden print:grid print:grid-cols-3 print:gap-4">
            {filtered.map((item) => {
              const url = item.image_url ? signed[item.image_url] : null;
              return (
                <PrintCard
                  key={`print-${item.location}-${item.id}`}
                  item={item}
                  url={url}
                />
              );
            })}
          </div>
        </>
      )}

      {/* ── SHOW MORE BUTTON (Hidden when printing) ───────────────────────── */}
      {!isLoading && hasMore && (
        <div className="flex justify-center pt-2 print:hidden">
          <Button
            id="show-more-btn"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            className="w-full sm:w-auto px-6 font-medium"
          >
            Show more ({filtered.length - paginated.length} remaining)
          </Button>
        </div>
      )}

      {/* ── PRODUCT QUICK VIEW MODAL (ON-SCREEN) ─────────────────────────── */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
            <div className="aspect-square w-full bg-muted relative overflow-hidden">
              {selectedItem.image_url && signed[selectedItem.image_url] ? (
                <img
                  src={signed[selectedItem.image_url]}
                  alt={selectedItem["Item Description"]}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2 bg-gradient-to-br from-muted to-muted/50">
                  <ImageOff className="h-12 w-12 opacity-30" />
                  <span className="text-xs text-muted-foreground/60">No image uploaded</span>
                </div>
              )}
              {/* Stock badge */}
              <div className="absolute top-3 left-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-md backdrop-blur-md ${
                    getStockStatus(selectedItem.Quantity ?? 0).badgeColor
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      getStockStatus(selectedItem.Quantity ?? 0).dotColor
                    }`}
                  />
                  {getStockStatus(selectedItem.Quantity ?? 0).label}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs font-mono text-muted-foreground">
                  SKU #{selectedItem.id} • {selectedItem.location} Branch
                </span>
                <DialogTitle className="text-lg font-bold mt-1 text-foreground leading-snug">
                  {selectedItem["Item Description"]}
                </DialogTitle>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block">Unit Price</span>
                  <strong className="text-base text-primary font-bold">
                    {formatCurrency(selectedItem.Price || 0)}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Stock Available</span>
                  <strong className="text-base text-foreground font-bold">
                    {selectedItem.Quantity ?? 0} units
                  </strong>
                </div>
                <div className="col-span-2 pt-2 border-t border-border/40 flex justify-between items-center">
                  <span className="text-muted-foreground">Total Inventory Value:</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency((selectedItem.Price || 0) * (selectedItem.Quantity || 0))}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${selectedItem["Item Description"]} - ${formatCurrency(
                        selectedItem.Price || 0
                      )}`
                    );
                    toast.success("Product details copied to clipboard");
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Product Info
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
