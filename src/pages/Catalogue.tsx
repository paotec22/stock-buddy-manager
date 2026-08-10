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
import { Badge } from "@/components/ui/badge";
<<<<<<< HEAD
=======
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
>>>>>>> dbef9933c2b8859b4001498738f3b1e35dd48e9b
import { supabase } from "@/lib/supabase";
import { InventoryItem } from "@/utils/inventoryUtils";
import {
  getInventoryImageUrls,
  optimizeExistingInventoryImage,
} from "@/lib/inventoryImages";
import { formatCurrency } from "@/utils/formatters";
<<<<<<< HEAD
import {
  ImageOff,
  Printer,
  Search,
  Sparkles,
  Loader2,
  Share2,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Package,
  TrendingUp,
  Camera,
  X,
} from "lucide-react";
=======
import { ImageOff, Printer, Search, Sparkles, Loader2, Share2, PackageSearch, MapPin } from "lucide-react";
>>>>>>> dbef9933c2b8859b4001498738f3b1e35dd48e9b
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const VIEW_KEY = "catalogue_view_mode";

<<<<<<< HEAD
type SortKey =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "qty_asc";
=======
const LOCATIONS = ["Ikeja"];
>>>>>>> dbef9933c2b8859b4001498738f3b1e35dd48e9b

type ViewMode = "grid" | "list";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getStockStatus(qty: number) {
  if (qty <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" };
  if (qty <= 10) return { label: "Low Stock", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" };
  return { label: "In Stock", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
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

// ─── Product Card (Grid) ──────────────────────────────────────────────────────
function GridCard({
  item,
  url,
}: {
  item: InventoryItem;
  url: string | null;
}) {
  const stock = getStockStatus(item.Quantity ?? 0);

  return (
    <Card className="overflow-hidden group card-hover border border-border/60">
      {/* Image */}
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
            {/* Gradient overlay for text on mobile */}
            <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ImageOff className="h-8 w-8 opacity-40" />
            <span className="text-xs opacity-50">No image</span>
          </div>
        )}

        {/* Stock badge — top right */}
        <span
          className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${stock.color} shadow-sm`}
        >
          {stock.label}
        </span>
      </div>

      {/* Card body */}
      <CardContent className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.4rem]">
          {item["Item Description"]}
        </h3>

        {/* SKU + Qty row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground font-mono">
            SKU #{item.id}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Qty:{" "}
            <span className="font-medium text-foreground">{item.Quantity ?? 0}</span>
          </span>
        </div>

        {/* Price pill */}
        <div className="pt-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-primary/10 text-primary">
            {formatCurrency(item.Price || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Product Row (List) ───────────────────────────────────────────────────────
function ListRow({
  item,
  url,
}: {
  item: InventoryItem;
  url: string | null;
}) {
  const stock = getStockStatus(item.Quantity ?? 0);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors group">
      {/* Thumbnail */}
      <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
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
            <ImageOff className="h-5 w-5 opacity-40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{item["Item Description"]}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">SKU #{item.id}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stock.color}`}
          >
            {stock.label}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Qty: <span className="font-medium text-foreground">{item.Quantity ?? 0}</span>
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="font-bold text-sm text-primary">
          {formatCurrency(item.Price || 0)}
        </span>
        <span className="text-[11px] text-muted-foreground sm:hidden">
          Qty: {item.Quantity ?? 0}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Catalogue() {
<<<<<<< HEAD
  const location = "Ikeja";

  // Filter & sort state
=======
  const [location, setLocation] = useState("Ikeja");
>>>>>>> dbef9933c2b8859b4001498738f3b1e35dd48e9b
  const [search, setSearch] = useState("");
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  const [optimizeProgress, setOptimizeProgress] = useState({ done: 0, total: 0 });
  const [selected, setSelected] = useState<InventoryItem | null>(null);

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

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["catalogue", location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory list")
        .select("*")
        .eq("location", "Ikeja")
        .order("Item Description", { ascending: true });
      if (error) throw error;
<<<<<<< HEAD
      return (data as InventoryItem[]) || [];
=======
      const fetchedItems = (data as InventoryItem[]) || [];
      return fetchedItems.filter(item => item.location?.toLowerCase() !== "not to carry");
>>>>>>> dbef9933c2b8859b4001498738f3b1e35dd48e9b
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
    return {
      total: items.length,
      withImages: items.filter((i) => i.image_url).length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
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
          return (a["Item Description"] ?? "").localeCompare(b["Item Description"] ?? "");
        case "name_desc":
          return (b["Item Description"] ?? "").localeCompare(a["Item Description"] ?? "");
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
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  // ── Optimize ───────────────────────────────────────────────────────────────
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

<<<<<<< HEAD
  const hasActiveFilters =
    search || minPrice || maxPrice || onlyWithImages || sort !== "name_asc";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 md:space-y-6 fade-in pb-8 print:space-y-0">
      {/* ── Print-only header (hidden on screen) ──────────────────────────── */}
      <div className="hidden print:block print:mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Product Catalogue</h1>
        <p className="text-sm text-muted-foreground mt-1">Ikeja</p>
        <hr className="mt-3 border-border" />
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Catalogue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse your inventory — share with customers or print.
          </p>
        </div>

        {/* Action buttons — wrap on small screens */}
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
                <Sparkles className="h-4 w-4 mr-1.5" />
                Optimize
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-1 sm:flex-none"
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </Button>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      {stats && !isLoading && (
        <div className="grid grid-cols-3 gap-2 md:gap-3 print:hidden">
          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">Products</p>
              <p className="text-base font-bold mt-0.5 truncate">{stats.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">With Images</p>
              <p className="text-base font-bold mt-0.5 truncate">{stats.withImages}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">Max Price</p>
              <p className="text-sm font-bold mt-0.5 truncate">
                {formatCurrency(stats.maxPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Search + Filter Bar ─────────────────────────────────────────────── */}
      <div className="space-y-2 print:hidden">
        {/* Top row: search + view toggle + filter toggle */}
        <div className="flex gap-2">
          {/* Search */}
=======
  const selectedUrl = selected?.image_url ? signed[selected.image_url] : null;

  return (
    <div className="space-y-6 fade-in">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 p-6 md:p-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit">Showroom</Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Product Catalogue</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              A curated visual showcase of your inventory. Share with customers, print, or browse in style.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={handleOptimizeImages} disabled={optimizing}>
              {optimizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing {optimizeProgress.done}/{optimizeProgress.total}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Optimize images
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
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
              }}
            >
              <Share2 className="h-4 w-4 mr-2" /> Share catalogue
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print / PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky glass filter bar */}
      <div className="sticky top-16 z-20 print:hidden">
        <div className="rounded-xl border border-border/60 bg-background/70 backdrop-blur-xl shadow-sm p-3 flex flex-col md:flex-row gap-3 md:items-center">
>>>>>>> dbef9933c2b8859b4001498738f3b1e35dd48e9b
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="catalogue-search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/60"
            />
          </div>
<<<<<<< HEAD
=======
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="md:w-48 bg-background/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={onlyWithImages ? "default" : "outline"}
            onClick={() => setOnlyWithImages((v) => !v)}
          >
            With images only
          </Button>
          <div className="hidden md:block text-xs text-muted-foreground pl-2 whitespace-nowrap">
            {filtered.length} product{filtered.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
>>>>>>> dbef9933c2b8859b4001498738f3b1e35dd48e9b

          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              id="view-grid-btn"
              title="Grid view"
              onClick={() => setView("grid")}
              className={`px-3 py-2 transition-colors ${
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Filter toggle button */}
          <Button
            id="toggle-filters-btn"
            variant="outline"
            size="icon"
            onClick={() => setFiltersOpen((v) => !v)}
            className="relative flex-shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Collapsible filter panel */}
        {filtersOpen && (
          <div className="rounded-xl border border-border/70 bg-card p-3 space-y-3 animate-[fadeIn_0.2s_ease-out]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Sort */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Sort by</label>
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger id="sort-select" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Name: A → Z</SelectItem>
                    <SelectItem value="name_desc">Name: Z → A</SelectItem>
                    <SelectItem value="price_asc">Price: Low → High</SelectItem>
                    <SelectItem value="price_desc">Price: High → Low</SelectItem>
                    <SelectItem value="qty_asc">Qty: Low → High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min price */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Min price
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
                  Max price
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

              {/* Images only */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Visibility
                </label>
                <Button
                  id="images-only-btn"
                  variant={onlyWithImages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOnlyWithImages((v) => !v)}
                  className="w-full h-9 text-sm justify-start"
                >
                  With images only
                </Button>
              </div>
            </div>

            {/* Clear filters */}
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
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Result count */}
        {!isLoading && (
          <p className="text-xs text-muted-foreground px-0.5">
            Showing{" "}
            <span className="font-medium text-foreground">
              {Math.min(paginated.length, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            product{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-2 text-primary underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </p>
        )}
      </div>

      {/* ── Content Area ────────────────────────────────────────────────────── */}
      {isLoading ? (
<<<<<<< HEAD
        view === "grid" ? (
          <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} view="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} view="list" />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No products found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {hasActiveFilters
                ? "Try adjusting your filters or search term."
                : "Add images to inventory items to build your catalogue."}
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : view === "grid" ? (
        /* Grid view */
        <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children">
          {paginated.map((item) => {
            const url = item.image_url ? signed[item.image_url] : null;
            return (
              <GridCard
                key={`${item.location}-${item.id}`}
                item={item}
                url={url}
              />
=======
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-5 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <PackageSearch className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">No products found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Try adjusting your search or filters. Add images to your inventory items to build a beautiful catalogue.
            </p>
          </CardContent>
        </Card>
      ) : (
      ) : view === "grid" ? (
        /* Grid view */
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 stagger-children print:hidden">
          {paginated.map((item) => {
            const url = item.image_url ? signed[item.image_url] : null;
            return (
              <Card
                key={`${item.location}-${item.id}`}
                onClick={() => setSelected(item)}
                className="overflow-hidden group cursor-pointer border-border/60 bg-card/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {url ? (
                    <img
                      src={url}
                      alt={item["Item Description"]}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out [image-rendering:auto]"
                      loading="lazy"
                      decoding="async"
                      width={800}
                      height={800}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
                      <ImageOff className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item["Item Description"]}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </div>
                  <p className="text-xl font-bold text-primary pt-1 tracking-tight">
                    {formatCurrency(item.Price || 0)}
                  </p>
                </CardContent>
              </Card>
>>>>>>> dbef9933c2b8859b4001498738f3b1e35dd48e9b
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {paginated.map((item) => {
            const url = item.image_url ? signed[item.image_url] : null;
            return (
              <ListRow
                key={`${item.location}-${item.id}`}
                item={item}
                url={url}
              />
            );
          })}
        </div>
      )}

      {/* ── Show More ───────────────────────────────────────────────────────── */}
      {!isLoading && hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            id="show-more-btn"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            className="w-full sm:w-auto"
          >
            Show more ({filtered.length - paginated.length} remaining)
          </Button>
        </div>
      )}

      {/* Product detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selected && (
            <div className="grid md:grid-cols-2">
              <div className="aspect-square bg-muted relative">
                {selectedUrl ? (
                  <img
                    src={selectedUrl}
                    alt={selected["Item Description"]}
                    className="h-full w-full object-contain bg-muted p-2"
                    decoding="async"
                  />

                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <ImageOff className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle className="text-2xl leading-tight">
                    {selected["Item Description"]}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="h-3 w-3" /> {selected.location}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Price</div>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(selected.Price || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
