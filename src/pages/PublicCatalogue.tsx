import { useEffect, useMemo, useState } from "react";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/formatters";
import {
  ImageOff,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Package,
  X,
  Camera,
  TrendingUp,
  Eye,
  Copy,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://itycbazttpidqlgmmrot.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWNiYXp0dHBpZHFsZ21tcm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTU3MDEsImV4cCI6MjA1MDYzMTcwMX0.S5Pa5PcYBQiOdJbDvTR_cAHKIfM8uGq-OVONyhpws9o";

const PAGE_SIZE = 20;
const VIEW_KEY = "pub_catalogue_view_mode";

type SortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc";
type ViewMode = "grid" | "list";

interface PublicItem {
  id: number;
  description: string;
  price: number | null;
  location: string;
  image: string | null;
  quantity?: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStockStatus(qty?: number | null) {
  if (qty == null || qty <= 0)
    return {
      label: "Out of Stock",
      badgeColor:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50",
      dotColor: "bg-red-500",
    };
  if (qty <= 10)
    return {
      label: "Low Stock",
      badgeColor:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/50",
      dotColor: "bg-amber-500",
    };
  return {
    label: "In Stock",
    badgeColor:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50",
    dotColor: "bg-emerald-500",
  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-card/60 animate-pulse">
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
    <div className="rounded-xl border bg-card/60 overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-5 bg-muted rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────
function GridCard({
  item,
  onClick,
}: {
  item: PublicItem;
  onClick: () => void;
}) {
  const stock = getStockStatus(item.quantity);
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border/60 bg-card overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-primary/40"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {item.image ? (
          <>
            <img
              src={item.image}
              alt={item.description}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              decoding="async"
              width={400}
              height={400}
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-slate-900 shadow-md backdrop-blur-sm">
                <Eye className="h-3 w-3" /> Quick View
              </span>
            </div>
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-1 bg-gradient-to-br from-muted to-muted/50">
            <ImageOff className="h-7 w-7 opacity-30" />
            <span className="text-[10px] opacity-50">No image</span>
          </div>
        )}

        <div
          className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-xs backdrop-blur-md ${stock.badgeColor}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${stock.dotColor}`} />
          {stock.label}
        </div>
      </div>

      <div className="p-2.5 space-y-1.5">
        <h3 className="font-semibold text-xs leading-snug line-clamp-2 min-h-[2rem] group-hover:text-primary transition-colors">
          {item.description}
        </h3>
        {item.quantity != null && (
          <p className="text-[10px] text-muted-foreground">
            Qty: <span className="font-semibold text-foreground">{item.quantity}</span>
          </p>
        )}
        <div className="pt-0.5">
          <span className="text-sm font-bold text-primary tracking-tight">
            {formatCurrency(item.price || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ListRow({
  item,
  onClick,
}: {
  item: PublicItem;
  onClick: () => void;
}) {
  const stock = getStockStatus(item.quantity);
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-all cursor-pointer group hover:border-primary/30"
    >
      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
        {item.image ? (
          <img
            src={item.image}
            alt={item.description}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
            width={48}
            height={48}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-4 w-4 opacity-30" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs truncate group-hover:text-primary transition-colors">
          {item.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-full border ${stock.badgeColor}`}
          >
            <span className={`h-1 w-1 rounded-full ${stock.dotColor}`} />
            {stock.label}
          </span>
          {item.quantity != null && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Qty: <span className="font-medium text-foreground">{item.quantity}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="font-bold text-sm text-primary">
          {formatCurrency(item.price || 0)}
        </p>
        {item.quantity != null && (
          <p className="text-[10px] text-muted-foreground sm:hidden">
            Qty: {item.quantity}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Print-Only Card Component ────────────────────────────────────────────────
function PrintCard({ item }: { item: PublicItem }) {
  return (
    <div className="print-card-item rounded-lg border border-slate-300 bg-white overflow-hidden p-0 flex flex-col justify-between text-slate-900 shadow-none">
      <div>
        <div className="aspect-square bg-slate-100 relative overflow-hidden border-b border-slate-200 flex items-center justify-center">
          {item.image ? (
            <img
              src={item.image}
              alt={item.description}
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

        <div className="p-2 space-y-1">
          <h4 className="font-bold text-[11px] leading-tight line-clamp-2 text-slate-900">
            {item.description}
          </h4>
          {item.quantity != null && (
            <p className="text-[9px] text-slate-500 font-mono">
              Available Qty: {item.quantity}
            </p>
          )}
        </div>
      </div>

      <div className="px-2 pb-2 pt-1 border-t border-slate-100 flex items-center justify-between mt-auto">
        <span className="text-[9px] uppercase font-bold text-slate-400">Price</span>
        <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          {formatCurrency(item.price || 0)}
        </span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PublicCatalogue() {
  const location = "Ikeja";

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<PublicItem | null>(null);

  const [view, setView] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(VIEW_KEY) as ViewMode) || "grid";
    } catch {
      return "grid";
    }
  });
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {}
    setPage(1);
  }, [view]);

  useEffect(() => {
    setPage(1);
  }, [search, sort, minPrice, maxPrice]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const qs = `?location=${encodeURIComponent(location)}`;
    fetch(`${SUPABASE_URL}/functions/v1/public-catalogue${qs}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error || `Request failed (${res.status})`);
          setItems([]);
        } else {
          setItems((json.items as PublicItem[]) ?? []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [location]);

  // Stats
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const prices = items.map((i) => i.price || 0).filter((p) => p > 0);
    return {
      total: items.length,
      withImages: items.filter((i) => i.image).length,
      maxPrice: prices.length ? Math.max(...prices) : 0,
    };
  }, [items]);

  const filtered = useMemo(() => {
    let out = items.filter((it) => {
      if (
        search.trim() &&
        !it.description?.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && (it.price || 0) < min) return false;
      if (!isNaN(max) && (it.price || 0) > max) return false;
      return true;
    });

    out = [...out].sort((a, b) => {
      switch (sort) {
        case "name_asc":
          return (a.description ?? "").localeCompare(b.description ?? "");
        case "name_desc":
          return (b.description ?? "").localeCompare(a.description ?? "");
        case "price_asc":
          return (a.price || 0) - (b.price || 0);
        case "price_desc":
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

    return out;
  }, [items, search, sort, minPrice, maxPrice]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;
  const hasActiveFilters = search || minPrice || maxPrice || sort !== "name_asc";

  const clearFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSort("name_asc");
  };

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── PRINT-ONLY STUNNING CATALOGUE HEADER ──────────────────────────── */}
      <div className="hidden print:block px-6 pt-4 print:mb-6">
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
          <span>Public Catalogue</span>
        </div>
      </div>

      {/* ── Header (Hidden when printing) ────────────────────────────────── */}
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/Puido_Smart_Solutions.svg"
              alt="Puido Smart Solutions"
              className="h-12 md:h-14 w-auto object-contain"
            />
            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-tight">
                Product Catalogue
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                Browse our available inventory — {location} Branch
              </p>
            </div>
          </div>
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              id="pub-view-grid-btn"
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
              id="pub-view-list-btn"
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-4 pb-10">
        {/* Stats (Hidden when printing) */}
        {stats && !loading && (
          <div className="grid grid-cols-3 gap-2 md:gap-3 print:hidden">
            <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-none">
                  Products
                </p>
                <p className="text-sm md:text-base font-bold mt-0.5">
                  {stats.total}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-none">
                  With Photos
                </p>
                <p className="text-sm md:text-base font-bold mt-0.5">
                  {stats.withImages}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-[11px] text-muted-foreground leading-none">
                  Max Price
                </p>
                <p className="text-xs md:text-sm font-bold mt-0.5 truncate">
                  {formatCurrency(stats.maxPrice)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search + Filter bar (Hidden when printing) */}
        <div className="space-y-2 print:hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="pub-catalogue-search"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              id="pub-toggle-filters-btn"
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

          {/* Collapsible filters */}
          {filtersOpen && (
            <div className="rounded-xl border border-border/70 bg-card p-3 space-y-3 animate-[fadeIn_0.2s_ease-out]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Sort by
                  </label>
                  <Select
                    value={sort}
                    onValueChange={(v) => setSort(v as SortKey)}
                  >
                    <SelectTrigger id="pub-sort-select" className="h-9 text-sm">
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Min price
                  </label>
                  <Input
                    id="pub-min-price"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Max price
                  </label>
                  <Input
                    id="pub-max-price"
                    type="number"
                    min={0}
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    id="pub-clear-filters-btn"
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

          {!loading && (
            <p className="text-xs text-muted-foreground px-0.5">
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min(paginated.length, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filtered.length}
              </span>{" "}
              product{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Content */}
        {loading ? (
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
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 print:hidden">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <Package className="h-7 w-7 text-destructive opacity-60" />
            </div>
            <div>
              <p className="font-semibold">Could not load catalogue</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 print:hidden">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-7 w-7 text-muted-foreground opacity-50" />
            </div>
            <div>
              <p className="font-semibold">No products found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "No products are available right now."}
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
            {/* Screen view */}
            {view === "grid" ? (
              <div className="grid gap-2.5 sm:gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 print:hidden">
                {paginated.map((item) => (
                  <GridCard
                    key={`${item.location}-${item.id}`}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 print:hidden">
                {paginated.map((item) => (
                  <ListRow
                    key={`${item.location}-${item.id}`}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}

            {/* Print-only view (all items, 4-column grid) */}
            <div className="hidden print:grid print:grid-cols-4 print:gap-2.5">
              {filtered.map((item) => (
                <PrintCard
                  key={`print-${item.location}-${item.id}`}
                  item={item}
                />
              ))}
            </div>
          </>
        )}

        {/* Show more (Hidden when printing) */}
        {!loading && hasMore && (
          <div className="flex justify-center pt-2 print:hidden">
            <Button
              id="pub-show-more-btn"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              className="w-full sm:w-auto"
            >
              Show more ({filtered.length - paginated.length} remaining)
            </Button>
          </div>
        )}
      </main>

      {/* Product Quick View Modal */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
            <div className="aspect-square w-full bg-muted relative overflow-hidden">
              {selectedItem.image ? (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.description}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2 bg-gradient-to-br from-muted to-muted/50">
                  <ImageOff className="h-12 w-12 opacity-30" />
                  <span className="text-xs text-muted-foreground/60">No image available</span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-md backdrop-blur-md ${
                    getStockStatus(selectedItem.quantity).badgeColor
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      getStockStatus(selectedItem.quantity).dotColor
                    }`}
                  />
                  {getStockStatus(selectedItem.quantity).label}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs font-mono text-muted-foreground">
                  {selectedItem.location} Branch
                </span>
                <DialogTitle className="text-lg font-bold mt-1 text-foreground leading-snug">
                  {selectedItem.description}
                </DialogTitle>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/50 border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground block">Price</span>
                  <strong className="text-base text-primary font-bold">
                    {formatCurrency(selectedItem.price || 0)}
                  </strong>
                </div>
                {selectedItem.quantity != null && (
                  <div>
                    <span className="text-muted-foreground block font-medium">Availability</span>
                    <strong className="text-base text-foreground font-bold">
                      {selectedItem.quantity} units
                    </strong>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${selectedItem.description} - ${formatCurrency(
                        selectedItem.price || 0
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
