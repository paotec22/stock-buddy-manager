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
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { MobileFAB } from "@/components/MobileFAB";
import { Share2 as ShareIcon, Printer as PrintIcon, Sparkles as SparklesIcon } from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const VIEW_KEY = "catalogue_view_mode";

type SortKey =
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "qty_asc";

type ViewMode = "grid" | "list";

// ─── Helpers ──────────────────────────────────────────────────────────
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

// ─── Skeleton Card ────────────────────────────────────────────────────────
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
      className="overflow-hidden group cursor-pointer border border-border/40 bg-card/65 backdrop-blur-sm rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
    >
      <div className="aspect-square bg-slate-100 dark:bg-slate-900/40 relative overflow-hidden flex items-center justify-center">
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
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-background/95 text-foreground shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <Eye className="h-3.5 w-3.5 text-primary" /> Quick View
              </span>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-1.5 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
            <ImageOff className="h-8 w-8 opacity-25 text-primary" />
            <span className="text-[10px] text-muted-foreground/60 font-medium">No image</span>
          </div>
        )}

        {/* Stock status pill */}
        <div
          className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm backdrop-blur-md ${stock.badgeColor}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${stock.dotColor}`} />
          {stock.label}
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-xs leading-snug line-clamp-2 min-h-[2rem] group-hover:text-primary transition-colors text-foreground/90">
          {item["Item Description"]}
        </h3>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
          <span className="font-mono bg-muted/80 text-muted-foreground border border-border/50 px-1.5 py-0.5 rounded">
            SKU #{item.id}
          </span>
          <span className="font-medium">
            Qty: <strong className="text-foreground font-semibold">{item.Quantity ?? 0}</strong>
          </span>
        </div>
        <div className="pt-1 flex items-center justify-between border-t border-border/40">
          <span className="text-sm font-bold text-primary tracking-tight">
            {formatCurrency(item.Price || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── On-Screen List Row ──────────────────────────────────────────────────────
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
      className="flex items-center gap-4 p-3 rounded-2xl border border-border/40 bg-card/65 backdrop-blur-sm hover:bg-card hover:shadow-md transition-all duration-300 cursor-pointer group hover:border-primary/40"
    >
      <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-900/40 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
        {url ? (
          <img
            src={url}
            alt={item["Item Description"]}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={56}
            height={56}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-primary/5 to-secondary/5">
            <ImageOff className="h-5 w-5 opacity-25 text-primary" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
          {item["Item Description"]}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[10px]">
          <span className="text-muted-foreground font-mono bg-muted/80 border border-border/50 px-1 py-0.2 rounded">SKU #{item.id}</span>
          <span
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.2 rounded-full border shadow-2xs backdrop-blur-md ${stock.badgeColor}`}
          >
            <span className={`h-1 w-1 rounded-full ${stock.dotColor}`} />
            {stock.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right pr-1">
        <span className="font-bold text-sm text-primary">
          {formatCurrency(item.Price || 0)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          Qty: <strong className="text-foreground">{item.Quantity ?? 0}</strong>
        </span>
      </div>
    </div>
  );
}

// ─── Print-Only Card Component (Clean, High-End Compact Print Layout) ────────
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
            <div className="flex flex-col items-center gap-0.5 text-slate-400">
              <ImageOff className="h-6 w-6" />
              <span className="text-[9px]">No image</span>
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="p-2 space-y-1">
          <h4 className="font-bold text-[11px] leading-tight line-clamp-2 text-slate-900">
            {item["Item Description"]}
          </h4>
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span>SKU: #{item.id}</span>
            <span>Qty: {item.Quantity ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Price Footer */}
      <div className="px-2 pb-2 pt-1 border-t border-slate-100 flex items-center justify-between mt-auto">
        <span className="text-[9px] uppercase font-bold text-slate-400">Price</span>
        <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          {formatCurrency(item.Price || 0)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
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

  // ── Data Query ─────────────────────────────────────────────────────────
  const { data: itemsData, isLoading } = useQuery({
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

  const items = useMemo(() => itemsData || [], [itemsData]);

  // Extract a stable serialized key of image URLs so signed URLs are only fetched when actual image paths change
  const imagePathsKey = useMemo(() => {
    if (!itemsData || itemsData.length === 0) return "";
    return itemsData
      .map((i) => i.image_url)
      .filter(Boolean)
      .sort()
      .join("|");
  }, [itemsData]);

  useEffect(() => {
    if (!imagePathsKey) {
      setSigned((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    const paths = imagePathsKey.split("|").filter(Boolean);
    let isCurrent = true;
    getInventoryImageUrls(paths).then((map) => {
      if (isCurrent) {
        setSigned(map);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [imagePathsKey]);

  // ── Stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const prices = items.map((i) => i.Price || 0).filter((p) => p > 0);
    return {
      total: items.length,
      withImages: items.filter((i) => i.image_url).length,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  }, [items]);

  // ── Filter + Sort ────────────────────────────────────────────────────────
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

  // ── Pagination ─────────────────────────────────────────────────────────
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

  const handlePrint = useCallback(() => {
    const originalTitle = document.title;
    try {
      document.title = "";
    } catch {}
    window.print();
    setTimeout(() => {
      try {
        document.title = originalTitle;
      } catch {}
    }, 1000);
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

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 fade-in pb-10 print:space-y-0 print:pb-0 catalogue-bg -mx-4 md:-mx-8 lg:-mx-16 xl:-mx-24 px-4 md:px-8 lg:px-16 xl:px-24 pt-4 md:pt-6">

      {/* ── PRINT-ONLY STUNNING CATALOGUE HEADER ──────────────────────────── */}
      <div className="hidden print:block print:mb-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <img
              src="/Puido_Smart_Solutions.svg"
              alt="Puido Smart Solutions"
              className="h-10 w-auto object-contain"
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
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card p-6 md:p-8 shadow-sm backdrop-blur-md print:hidden flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Subtle solid glow decoration */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
            <img
              src="/Puido_Smart_Solutions.svg"
              alt="Puido Smart Solutions"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary">
              Product Catalogue
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">
              Browse and manage available inventory for <span className="text-primary font-semibold">{location}</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 relative z-10 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOptimizeImages}
            disabled={optimizing}
            className="flex-1 sm:flex-initial min-h-[40px] sm:min-h-0 sm:h-9 rounded-xl hover:bg-primary/5 hover:text-primary border-border/80 transition-all font-medium active:scale-[0.98]"
          >
            {optimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                <span className="truncate text-primary">
                  {optimizeProgress.done}/{optimizeProgress.total}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
                <span className="text-primary">Optimize</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex-1 sm:flex-initial min-h-[40px] sm:min-h-0 sm:h-9 rounded-xl hover:bg-primary/5 hover:text-primary border-border/80 transition-all font-medium active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4 mr-1.5 text-primary" />
            <span className="text-primary">Share Link</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial min-h-[40px] sm:min-h-0 sm:h-9 rounded-xl font-semibold shadow-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            <span>Print Catalogue</span>
          </Button>
        </div>
      </div>

      {/* ── SCREEN STATS BAR (Hidden when printing) ──────────────────────── */}
      {stats && !isLoading && (
        <div className="hidden sm:grid sm:grid-cols-3 gap-3 md:gap-4 print:hidden">
          <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-border/40 bg-card/65 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none font-semibold uppercase tracking-wider">Total Products</p>
              <p className="text-lg font-extrabold mt-1.5 truncate text-foreground">{stats.total}</p>
            </div>
          </div>

          <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-border/40 bg-card/65 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none font-semibold uppercase tracking-wider">With Photos</p>
              <p className="text-lg font-extrabold mt-1.5 truncate text-foreground">{stats.withImages}</p>
            </div>
          </div>

          <div className="relative overflow-hidden flex items-center gap-4 rounded-2xl border border-border/40 bg-card/65 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none font-semibold uppercase tracking-wider">Highest Price</p>
              <p className="text-lg font-extrabold mt-1.5 truncate text-primary">
                {formatCurrency(stats.maxPrice)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SEARCH & FILTER CONTROLS (Hidden when printing) ───────────────── */}
      <div className="space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Bar (No icon as requested) */}
          <div className="relative flex-1">
            <Input
              id="catalogue-search"
              placeholder="Search by product title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card/65 backdrop-blur-xs px-3.5 h-11 sm:h-10 border-border/60 focus-visible:ring-primary/20 rounded-xl text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-[32px] min-w-[32px] rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            {/* View toggle */}
            <div className="flex rounded-xl border border-border/60 bg-card/65 backdrop-blur-xs overflow-hidden p-0.5 h-11 sm:h-10">
              <button
                id="view-grid-btn"
                title="Grid view"
                onClick={() => setView("grid")}
                className={`min-h-[36px] sm:min-h-0 min-w-[38px] px-3 py-1.5 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-[0.98] ${
                  view === "grid"
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                id="view-list-btn"
                title="List view"
                onClick={() => setView("list")}
                className={`min-h-[36px] sm:min-h-0 min-w-[38px] px-3 py-1.5 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-[0.98] ${
                  view === "list"
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
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
              onClick={() => setFiltersOpen((v) => !v)}
              className={`h-11 sm:h-10 px-4 rounded-xl border-border/60 bg-card/65 backdrop-blur-xs transition-all flex items-center gap-2 active:scale-[0.98] ${
                filtersOpen ? "border-primary text-primary bg-primary/5" : ""
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

        {/* Collapsible Filter Panel */}
        {filtersOpen && (
          <div className="rounded-2xl border border-border/40 bg-card/80 p-4 space-y-3.5 shadow-md backdrop-blur-md animate-[fadeIn_0.2s_ease-out] relative">
            <div className="absolute right-3.5 top-3.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFiltersOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Sort */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sort Order
                </label>
                <Select
                  value={sort}
                  onValueChange={(v) => setSort(v as SortKey)}
                >
                  <SelectTrigger id="sort-select" className="min-h-[40px] text-sm rounded-xl bg-background/50 border-border/60">
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
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Min Price (₦)
                </label>
                <Input
                  id="min-price-input"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="min-h-[40px] text-sm rounded-xl bg-background/50 border-border/60"
                />
              </div>

              {/* Max price */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Max Price (₦)
                </label>
                <Input
                  id="max-price-input"
                  type="number"
                  min={0}
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="min-h-[40px] text-sm rounded-xl bg-background/50 border-border/60"
                />
              </div>

              {/* Images only toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Photo Status
                </label>
                <Button
                  id="images-only-btn"
                  variant={onlyWithImages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOnlyWithImages((v) => !v)}
                  className={`w-full min-h-[40px] text-sm justify-start rounded-xl font-medium active:scale-[0.98] ${
                    onlyWithImages
                      ? "bg-primary text-primary-foreground hover:bg-primary/95"
                      : "bg-background/50 hover:bg-muted border-border/60 text-muted-foreground"
                  }`}
                >
                  {onlyWithImages ? (
                    <>
                      <span className="sm:hidden">With photos only</span>
                      <span className="hidden sm:inline">Showing photos only</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">All items</span>
                      <span className="hidden sm:inline">All items (with or without photos)</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Clear button */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-1 border-t border-border/40 mt-1">
                <Button
                  id="clear-filters-btn"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground min-h-[36px] hover:text-foreground font-semibold hover:bg-transparent"
                >
                  <X className="h-3.5 w-3.5 mr-1 text-destructive" />
                  Reset all filters
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
          <div className="grid gap-2.5 sm:gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 print:hidden">
            {Array.from({ length: 10 }).map((_, i) => (
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
            <Button variant="outline" size="sm" onClick={clearFilters} className="min-h-[40px] px-4 font-medium">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* On-screen Paginated Grid/List (Hidden when printing) */}
          {view === "grid" ? (
            <div className="grid gap-2.5 sm:gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 stagger-children print:hidden">
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
          <div className="hidden print:grid print:grid-cols-4 print:gap-2.5">
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
            className="w-full sm:w-auto min-h-[44px] px-6 font-medium text-sm rounded-xl active:scale-[0.98]"
          >
            Show more ({filtered.length - paginated.length} remaining)
          </Button>
        </div>
      )}

      {/* ── PRODUCT QUICK VIEW MODAL (ON-SCREEN) ─────────────────────────── */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-[92vw] sm:max-w-[85vw] md:max-w-3xl p-0 overflow-hidden rounded-3xl border border-border/40 bg-card/95 backdrop-blur-md shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full max-h-[85vh] md:max-h-[70vh] overflow-y-auto md:overflow-hidden">
              
              {/* Left: Image Container */}
              <div className="relative aspect-square md:aspect-auto md:h-full w-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center border-b md:border-b-0 md:border-r border-border/40">
                {selectedItem.image_url && signed[selectedItem.image_url] ? (
                  <img
                    src={signed[selectedItem.image_url]}
                    alt={selectedItem["Item Description"]}
                    className="h-full w-full object-cover md:absolute md:inset-0"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-3 py-12">
                    <ImageOff className="h-16 w-16 opacity-20 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground/60">No image uploaded</span>
                  </div>
                )}
                
                {/* Stock status pill overlay */}
                <div className="absolute top-4 left-4 z-10">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-lg backdrop-blur-md ${
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

              {/* Right: Info Panel */}
              <div className="flex flex-col justify-between p-5 sm:p-6 md:p-8 space-y-6 md:overflow-y-auto h-full">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-primary bg-primary/10 border border-primary/10 px-2 py-0.5 rounded-full font-mono">
                      SKU #{selectedItem.id} • {selectedItem.location} Branch
                    </span>
                    <DialogTitle className="text-xl font-extrabold mt-3 text-foreground leading-tight tracking-tight">
                      {selectedItem["Item Description"]}
                    </DialogTitle>
                  </div>

                  {/* Price & Quantity Grid Cards */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 shadow-3xs">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70 block">Unit Price</span>
                      <strong className="text-lg text-primary font-black tracking-tight mt-1 block">
                        {formatCurrency(selectedItem.Price || 0)}
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/60 border border-border/50 shadow-3xs">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">Stock Available</span>
                      <strong className="text-lg text-foreground font-black tracking-tight mt-1 block">
                        {selectedItem.Quantity ?? 0} <span className="text-xs font-medium text-muted-foreground">units</span>
                      </strong>
                    </div>
                  </div>

                  {/* Features list */}
                  {selectedItem.features && selectedItem.features.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Key Product Features
                      </h4>
                      <ul className="space-y-2">
                        {selectedItem.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-foreground/80 leading-relaxed"
                          >
                            <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2.5 pt-4 border-t border-border/40 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-h-[44px] rounded-xl hover:bg-primary/5 border-border/80 transition-all font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${selectedItem["Item Description"]} - ${formatCurrency(
                          selectedItem.Price || 0
                        )}`
                      );
                      toast.success("Product details copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4 text-primary" /> Copy Info
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="min-h-[44px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all active:scale-[0.98]"
                    onClick={() => setSelectedItem(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}
      <MobileFAB
        primaryAction={{
          label: "Share",
          icon: ShareIcon,
          onClick: handleShare,
          shortcut: "⌘S",
        }}
        secondaryActions={[
          { label: "Print", icon: PrintIcon, onClick: handlePrint },
          { label: "Optimize Images", icon: SparklesIcon, onClick: handleOptimizeImages },
        ]}
        tourId="fab"
      />
    </div>
  );
}
